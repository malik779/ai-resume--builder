// Phase 5 — TS client for the optional Python AI worker (apps/ai-worker).
//
// No top-level "server-only" guard so the test harness (plain Node tsx) can
// instantiate the classes against a Node http mock. The runtime singleton
// (runtime.ts) is server-only; that guard is the load-bearing one.
//
// The worker provides local OCR + layout analysis. It is OPTIONAL: when
// AI_WORKER_URL is unset (or the worker is unreachable) the client reports
// itself unavailable and the caller falls back to premium APIs.

export interface OcrInput {
  filename: string;
  mimeType: string;
  buffer: ArrayBuffer;
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  source: "local" | "premium";
}

export interface LayoutInput {
  filename: string;
  mimeType: string;
  buffer: ArrayBuffer;
}

// Phase 6 will fill this out — Phase 5 ships the contract only.
export interface LayoutResult {
  shell: string;
  regions: { main: string[]; sidebar?: string[] };
  confidence: number;
}

export interface AIWorkerClient {
  available(): Promise<boolean>;
  extractOcr(input: OcrInput): Promise<OcrResult>;
  extractLayout(input: LayoutInput): Promise<LayoutResult>;
}

export class WorkerUnavailableError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "WorkerUnavailableError";
    this.code = code;
  }
}

const DEFAULT_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const controller = new AbortController();
  const handle = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(handle);
  }
}

export class HttpAIWorkerClient implements AIWorkerClient {
  private healthOk: boolean | null = null;
  private healthCheckedAt = 0;
  private readonly healthTtlMs = 30_000;

  constructor(private readonly baseUrl: string) {
    if (!baseUrl) throw new Error("HttpAIWorkerClient requires a base URL");
  }

  async available(): Promise<boolean> {
    if (
      this.healthOk !== null &&
      Date.now() - this.healthCheckedAt < this.healthTtlMs
    ) {
      return this.healthOk;
    }
    try {
      const r = await fetchWithTimeout(`${this.baseUrl}/health`, {
        method: "GET",
        timeoutMs: 1_500,
      });
      this.healthOk = r.ok;
    } catch {
      this.healthOk = false;
    }
    this.healthCheckedAt = Date.now();
    return this.healthOk;
  }

  async extractOcr(input: OcrInput): Promise<OcrResult> {
    if (!(await this.available())) {
      throw new WorkerUnavailableError(
        "WORKER_DOWN",
        "AI worker is not reachable",
      );
    }
    const fd = new FormData();
    fd.set(
      "file",
      new Blob([input.buffer], { type: input.mimeType }),
      input.filename,
    );
    const r = await fetchWithTimeout(`${this.baseUrl}/extract/ocr`, {
      method: "POST",
      body: fd,
      timeoutMs: 30_000,
    });
    if (!r.ok) {
      throw new WorkerUnavailableError(
        "WORKER_OCR_FAILED",
        `Worker returned ${r.status}`,
      );
    }
    const body = (await r.json()) as { rawText?: string; confidence?: number };
    return {
      rawText: body.rawText ?? "",
      confidence: typeof body.confidence === "number" ? body.confidence : 0.5,
      source: "local",
    };
  }

  async extractLayout(input: LayoutInput): Promise<LayoutResult> {
    if (!(await this.available())) {
      throw new WorkerUnavailableError(
        "WORKER_DOWN",
        "AI worker is not reachable",
      );
    }
    const fd = new FormData();
    fd.set(
      "file",
      new Blob([input.buffer], { type: input.mimeType }),
      input.filename,
    );
    const r = await fetchWithTimeout(`${this.baseUrl}/extract/layout`, {
      method: "POST",
      body: fd,
      timeoutMs: 30_000,
    });
    if (!r.ok) {
      throw new WorkerUnavailableError(
        "WORKER_LAYOUT_FAILED",
        `Worker returned ${r.status}`,
      );
    }
    const body = (await r.json()) as Partial<LayoutResult>;
    return {
      shell: body.shell ?? "single-column",
      regions: body.regions ?? { main: [] },
      confidence: body.confidence ?? 0,
    };
  }
}

// Used when AI_WORKER_URL is not configured. Always reports unavailable.
export class NullAIWorkerClient implements AIWorkerClient {
  async available(): Promise<boolean> {
    return false;
  }
  async extractOcr(): Promise<OcrResult> {
    throw new WorkerUnavailableError(
      "WORKER_NOT_CONFIGURED",
      "AI_WORKER_URL is not set",
    );
  }
  async extractLayout(): Promise<LayoutResult> {
    throw new WorkerUnavailableError(
      "WORKER_NOT_CONFIGURED",
      "AI_WORKER_URL is not set",
    );
  }
}

let _client: AIWorkerClient | null = null;

export function getAIWorkerClient(): AIWorkerClient {
  if (_client) return _client;
  const url = process.env.AI_WORKER_URL?.trim();
  _client = url ? new HttpAIWorkerClient(url) : new NullAIWorkerClient();
  return _client;
}

// Test seam: lets the smoke test inject a fake without monkey-patching globals.
export function setAIWorkerClientForTesting(client: AIWorkerClient | null): void {
  _client = client;
}
