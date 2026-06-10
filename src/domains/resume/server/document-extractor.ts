import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import * as mammoth from "mammoth";
import { getAIWorkerClient, WorkerUnavailableError } from "./ai-worker-client";

// Document text extraction.
//
// Phase 4: PDF (Claude vision), DOCX (mammoth), TXT (decode).
// Phase 5: image (worker → Claude vision fallback). Adds source so callers
//   can record local vs premium telemetry.

export type SupportedFormat = "pdf" | "docx" | "txt" | "image";

export type ExtractionSource = "local-worker" | "claude-vision" | "deterministic";

export interface ExtractInput {
  filename: string;
  mimeType: string;
  buffer: ArrayBuffer;
}

export interface ExtractResult {
  rawText: string;
  format: SupportedFormat;
  byteLength: number;
  source: ExtractionSource;
  confidence: number;
}

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export class DocumentExtractionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DocumentExtractionError";
    this.code = code;
  }
}

function detectFormat(input: { filename: string; mimeType: string }): SupportedFormat {
  const name = input.filename.toLowerCase();
  const mt = input.mimeType.toLowerCase();
  if (mt === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mt.includes("wordprocessingml") ||
    mt === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    return "docx";
  }
  if (
    mt.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return "image";
  }
  if (mt.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return "txt";
  }
  throw new DocumentExtractionError(
    "UNSUPPORTED_FORMAT",
    `Unsupported file type: ${input.mimeType || input.filename}`,
  );
}

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

async function extractPdfViaVision(buffer: ArrayBuffer): Promise<string> {
  const base64 = Buffer.from(buffer).toString("base64");
  const response = await anthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract all text content from this resume PDF. Return the raw text only, preserving structure with newlines.",
          },
        ],
      },
    ],
  });
  const first = response.content[0];
  return first.type === "text" ? first.text : "";
}

async function extractImageViaVision(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<string> {
  const base64 = Buffer.from(buffer).toString("base64");
  const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mediaType = validImageTypes.includes(mimeType)
    ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "image/png";
  const response = await anthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Extract all text content from this resume screenshot. Return the raw text only, preserving structure with newlines.",
          },
        ],
      },
    ],
  });
  const first = response.content[0];
  return first.type === "text" ? first.text : "";
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  return result.value;
}

// Local-first structured-text extraction via the AI worker (MarkItDown).
// Returns clean Markdown for text-layer PDFs, DOCX, XLSX, PPTX, HTML, …
// Returns null when the worker is unavailable or extracts too little text
// (e.g. scanned PDFs) so the caller falls back to the format's default path.
async function tryWorkerConvert(input: ExtractInput): Promise<string | null> {
  const worker = getAIWorkerClient();
  if (!(await worker.available())) return null;
  try {
    const { markdown } = await worker.convertDocument({
      filename: input.filename,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });
    return markdown.trim().length >= 50 ? markdown : null;
  } catch (e) {
    if (!(e instanceof WorkerUnavailableError)) throw e;
    return null; // WORKER_DOWN / INSUFFICIENT_TEXT / NOT_CONFIGURED → fall back
  }
}

function extractTxt(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("utf-8");
}

interface InternalExtraction {
  rawText: string;
  source: ExtractionSource;
  confidence: number;
}

async function extractImage(input: ExtractInput): Promise<InternalExtraction> {
  // Local-first: try the worker, fall back to Claude vision.
  const worker = getAIWorkerClient();
  if (await worker.available()) {
    try {
      const ocr = await worker.extractOcr({
        filename: input.filename,
        mimeType: input.mimeType,
        buffer: input.buffer,
      });
      if (ocr.rawText.trim().length > 0) {
        return {
          rawText: ocr.rawText,
          source: "local-worker",
          confidence: ocr.confidence,
        };
      }
    } catch (e) {
      if (!(e instanceof WorkerUnavailableError)) throw e;
      // Worker explicitly unavailable — fall through to premium fallback.
    }
  }

  const text = await extractImageViaVision(input.buffer, input.mimeType);
  return { rawText: text, source: "claude-vision", confidence: 0.85 };
}

export async function extractDocument(
  input: ExtractInput,
): Promise<ExtractResult> {
  if (input.buffer.byteLength === 0) {
    throw new DocumentExtractionError("EMPTY_FILE", "File is empty");
  }
  if (input.buffer.byteLength > MAX_BYTES) {
    throw new DocumentExtractionError(
      "FILE_TOO_LARGE",
      `File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)} MB limit`,
    );
  }

  const format = detectFormat(input);
  let rawText = "";
  let source: ExtractionSource = "deterministic";
  let confidence = 1;

  if (format === "pdf") {
    // Text-layer PDFs: MarkItDown extracts cleanly & cheaply (no vision tokens).
    // Scanned/image PDFs return too little text → fall back to Claude vision.
    const worker = await tryWorkerConvert(input);
    if (worker) {
      rawText = worker;
      source = "local-worker";
      confidence = 0.9;
    } else {
      rawText = await extractPdfViaVision(input.buffer);
      source = "claude-vision";
      confidence = 0.85;
    }
  } else if (format === "docx") {
    // MarkItDown (python-docx) preserves headings/tables; mammoth is the
    // deterministic fallback when the worker is unavailable.
    const worker = await tryWorkerConvert(input);
    if (worker) {
      rawText = worker;
      source = "local-worker";
      confidence = 0.95;
    } else {
      rawText = await extractDocx(input.buffer);
      source = "deterministic";
      confidence = 0.95;
    }
  } else if (format === "txt") {
    rawText = extractTxt(input.buffer);
    source = "deterministic";
    confidence = 1;
  } else {
    const r = await extractImage(input);
    rawText = r.rawText;
    source = r.source;
    confidence = r.confidence;
  }

  rawText = rawText.replace(/\s+\n/g, "\n").trim();

  if (rawText.length < 50) {
    throw new DocumentExtractionError(
      "INSUFFICIENT_TEXT",
      "Could not extract enough text from the file. Try a different format.",
    );
  }

  return {
    rawText,
    format,
    byteLength: input.buffer.byteLength,
    source,
    confidence,
  };
}
