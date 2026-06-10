import Anthropic from "@anthropic-ai/sdk";
import { estimateCost } from "./factory";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface TemplateAnalysisResult {
  shell: "single" | "sidebar-left" | "sidebar-right" | "two-column";
  header: string;
  section: string;
  uppercase: boolean;
  sidebarWidthPct?: number;
  sidebarBg?: string;
  mainSections: string[];
  sidebarSections?: string[];
  confidence: number;
  notes: string[];
}

export interface VisionAnalysisMeta {
  modelId: string;
  promptTokens: number;
  outputTokens: number;
  durationMs: number;
  costUsd: number;
  escalated: boolean; // true when Sonnet was used instead of Haiku
}

export interface TemplateAnalysisResponse {
  result: TemplateAnalysisResult;
  meta: VisionAnalysisMeta;
}

// Partial worker result that can be passed as a hint to Claude so it does not
// have to re-derive already-known fields (saves tokens, improves accuracy).
export interface WorkerHint {
  shell?: string;
  header?: string;
  section?: string;
  uppercase?: boolean;
  sidebarWidthPct?: number;
  sidebarBg?: string;
  mainSections?: string[];
  sidebarSections?: string[];
}

// ── Models ────────────────────────────────────────────────────────────────────

// Haiku is used as the first pass (cheap, fast, vision-capable).
// Sonnet is used when Haiku's confidence is below the escalation threshold.
const MODEL_FAST    = "claude-haiku-4-5-20251001";
const MODEL_QUALITY = "claude-sonnet-4-6";

// If Haiku's returned confidence is below this value, automatically retry
// with Sonnet to ensure quality is not compromised.
const ESCALATE_THRESHOLD = 0.70;

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a resume template layout analyzer. Given a screenshot of a resume template, detect its configuration. Return ONLY a valid JSON object — no markdown fences, no commentary.`;

function buildUserPrompt(hint?: WorkerHint): string {
  const hintBlock = hint
    ? `\nLocal analysis already detected: ${JSON.stringify(hint, null, 2)}\nUse this as context but override any uncertain field if you see differently.\n`
    : "";

  return `Analyze this resume template screenshot and return a JSON object matching this exact schema:

{
  "shell": "single" | "sidebar-left" | "sidebar-right" | "two-column",
  "header": "stack-left" | "stack-center" | "split" | "banner-dark" | "banner-accent" | "two-tone" | "line-accent" | "underbar",
  "section": "underline" | "overline" | "left-bar" | "filled" | "caps" | "flanked" | "badge" | "side-dot",
  "uppercase": boolean,
  "sidebarWidthPct": number 15-45 (only for sidebar-left/right shells),
  "sidebarBg": "dark-navy"|"dark-charcoal"|"dark-accent"|"light-gray"|"light-warm"|"light-accent" (only for sidebar shells),
  "mainSections": string[] from ["contact","summary","experience","education","skills","projects","certifications","languages"],
  "sidebarSections": string[] (only for sidebar shells),
  "confidence": number 0.0-1.0,
  "notes": string[] (short reasons for each major decision)
}
${hintBlock}
Definitions:
- shell: single=full-width, sidebar-left=coloured panel left + content right, sidebar-right=content left + coloured panel right, two-column=equal no-bg split
- header styles: stack-left=name+contact stacked left-aligned, stack-center=stacked centered, split=name left/contact right, banner-dark=full-width dark bg, banner-accent=full-width accent-colour bg, two-tone=dark+accent two rows, line-accent=short accent bar above name, underbar=name with gradient bottom line
- section: how section title dividers are decorated (underline=bottom border, overline=top bar, left-bar=vertical strip, filled=chip bg, caps=bold uppercase only, flanked=dashes both sides, badge=rounded pill, side-dot=bullet prefix)
- uppercase: true when section titles appear in ALL CAPS
- confidence: 1.0=perfectly clear, 0.5=partially visible, 0.0=cannot determine`;
}

// ── Internal call ─────────────────────────────────────────────────────────────

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  return (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
}

function stripFence(text: string): string {
  return text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
}

async function callVisionModel(
  imageBase64: string,
  mediaType: ImageMediaType,
  modelId: string,
  hint?: WorkerHint,
): Promise<{ result: TemplateAnalysisResult; promptTokens: number; outputTokens: number; durationMs: number }> {
  const client = getClient();
  const start = Date.now();

  const response = await client.messages.create({
    model: modelId,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: buildUserPrompt(hint) },
        ],
      },
    ],
  });

  const durationMs = Date.now() - start;
  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  let parsed: TemplateAnalysisResult;
  try {
    parsed = JSON.parse(stripFence(rawText)) as TemplateAnalysisResult;
  } catch {
    throw new Error(`Vision model returned invalid JSON (${modelId}): ${rawText.slice(0, 300)}`);
  }

  // Ensure confidence is clamped to [0, 1]
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0.5));

  return {
    result: parsed,
    promptTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    durationMs,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AnalyzeOptions {
  /** Partial result from the Python worker to use as a hint. */
  hint?: WorkerHint;
  /** Confidence below which Haiku result is discarded and Sonnet is called.
   *  Defaults to ESCALATE_THRESHOLD (0.70). Set to 0 to always use Haiku,
   *  set to 1 to always escalate to Sonnet. */
  escalateThreshold?: number;
}

/**
 * Analyse a template screenshot.
 *
 * Routing:
 *   1. Call Claude Haiku (fast, cheap).
 *   2. If Haiku's confidence < escalateThreshold (default 0.70), retry with
 *      Claude Sonnet so quality is never compromised.
 *
 * A worker hint (from the Python OpenCV pipeline) is injected into the prompt
 * so Claude can focus on fields the local detector was uncertain about.
 */
export async function analyzeTemplateScreenshot(
  imageBase64: string,
  mediaType: ImageMediaType,
  opts: AnalyzeOptions = {},
): Promise<TemplateAnalysisResponse> {
  const threshold = opts.escalateThreshold ?? ESCALATE_THRESHOLD;

  // Pass 1: Haiku
  const fast = await callVisionModel(imageBase64, mediaType, MODEL_FAST, opts.hint);
  const fastCost = estimateCost(MODEL_FAST, fast.promptTokens, fast.outputTokens);

  if (fast.result.confidence >= threshold) {
    return {
      result: fast.result,
      meta: {
        modelId: MODEL_FAST,
        promptTokens: fast.promptTokens,
        outputTokens: fast.outputTokens,
        durationMs: fast.durationMs,
        costUsd: fastCost,
        escalated: false,
      },
    };
  }

  // Pass 2: Sonnet (escalated) — inject Haiku result as an additional hint so
  // Sonnet builds on it rather than starting from scratch.
  const sonnetHint: WorkerHint = {
    ...(opts.hint ?? {}),
    shell:          fast.result.shell,
    header:         fast.result.header,
    section:        fast.result.section,
    uppercase:      fast.result.uppercase,
    sidebarWidthPct: fast.result.sidebarWidthPct,
    sidebarBg:      fast.result.sidebarBg,
    mainSections:   fast.result.mainSections,
    sidebarSections: fast.result.sidebarSections,
  };

  const quality = await callVisionModel(imageBase64, mediaType, MODEL_QUALITY, sonnetHint);
  const qualityCost = estimateCost(MODEL_QUALITY, quality.promptTokens, quality.outputTokens);

  return {
    result: quality.result,
    meta: {
      modelId: MODEL_QUALITY,
      promptTokens: fast.promptTokens + quality.promptTokens,
      outputTokens: fast.outputTokens + quality.outputTokens,
      durationMs: fast.durationMs + quality.durationMs,
      costUsd: fastCost + qualityCost,
      escalated: true,
    },
  };
}
