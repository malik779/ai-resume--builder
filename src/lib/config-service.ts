// ─────────────────────────────────────────────────────────────────────────────
// ConfigService — runtime configuration from DB with .env fallback.
// DB values take precedence; env vars serve as defaults if no DB row exists.
// Uses a short in-memory TTL cache to avoid per-request DB hits.
// ─────────────────────────────────────────────────────────────────────────────

import { db as prisma } from "@/lib/db";

const CACHE_TTL_MS = 60_000; // 1 minute

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// ENV fallbacks for every managed key
const ENV_FALLBACKS: Record<string, string | undefined> = {
  "ai.anthropic.apiKey":        process.env.ANTHROPIC_API_KEY,
  "ai.openai.apiKey":           process.env.OPENAI_API_KEY,
  "ai.deepseek.apiKey":         process.env.DEEPSEEK_API_KEY,
  "ai.defaultProvider":         process.env.AI_DEFAULT_PROVIDER ?? "anthropic",
  "ai.parse.provider":          process.env.AI_PARSE_PROVIDER ?? "anthropic",
  "ai.model.review":            process.env.AI_MODEL_REVIEW ?? "claude-sonnet-4-6",
  "ai.model.tailor":            process.env.AI_MODEL_TAILOR ?? "claude-sonnet-4-6",
  "ai.model.chat":              process.env.AI_MODEL_CHAT ?? "claude-haiku-4-5-20251001",
  "ai.model.parse":             process.env.AI_MODEL_PARSE ?? "claude-haiku-4-5-20251001",
  "stripe.secretKey":           process.env.STRIPE_SECRET_KEY,
  "stripe.publishableKey":      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  "stripe.webhookSecret":       process.env.STRIPE_WEBHOOK_SECRET,
  "stripe.price.basic.monthly":     process.env.STRIPE_PRICE_BASIC_MONTHLY,
  "stripe.price.basic.yearly":      process.env.STRIPE_PRICE_BASIC_YEARLY,
  "stripe.price.pro.monthly":       process.env.STRIPE_PRICE_PRO_MONTHLY,
  "stripe.price.pro.yearly":        process.env.STRIPE_PRICE_PRO_YEARLY,
  "stripe.price.enterprise.monthly": process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  "stripe.price.enterprise.yearly":  process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  "tiers.free.maxResumes":      process.env.TIER_FREE_MAX_RESUMES ?? "3",
  "tiers.free.aiOpsPerMonth":   process.env.TIER_FREE_AI_OPS ?? "10",
  "tiers.basic.maxResumes":     process.env.TIER_BASIC_MAX_RESUMES ?? "10",
  "tiers.basic.aiOpsPerMonth":  process.env.TIER_BASIC_AI_OPS ?? "50",
  "tiers.pro.maxResumes":       process.env.TIER_PRO_MAX_RESUMES ?? "999",
  "tiers.pro.aiOpsPerMonth":    process.env.TIER_PRO_AI_OPS ?? "500",
  "tiers.enterprise.maxResumes":    process.env.TIER_ENTERPRISE_MAX_RESUMES ?? "999",
  "tiers.enterprise.aiOpsPerMonth": process.env.TIER_ENTERPRISE_AI_OPS ?? "9999",
  "features.aiReview":          "true",
  "features.aiTailor":          "true",
  "features.jobSearch":         "true",
  "features.resumeParser":      "true",
  "features.exportDocx":        "true",
  "features.maintenance":       "false",
  "features.maintenanceMessage": "We're performing scheduled maintenance. Back shortly.",
  "app.name":                   process.env.NEXT_PUBLIC_APP_NAME ?? "ResumeAI Pro",
  "app.url":                    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  "app.supportEmail":           process.env.SUPPORT_EMAIL ?? "support@resumeai.pro",
  "app.trialDays":              process.env.FREE_TRIAL_DAYS ?? "14",
};

export async function configGet(key: string): Promise<string | undefined> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    if (row) {
      cache.set(key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS });
      return row.value;
    }
  } catch {
    // DB unavailable — fall through to env
  }

  return ENV_FALLBACKS[key];
}

export async function configGetNumber(key: string, fallback = 0): Promise<number> {
  const v = await configGet(key);
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

export async function configGetBool(key: string, fallback = false): Promise<boolean> {
  const v = await configGet(key);
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export async function configGetGroup(group: string): Promise<Record<string, string>> {
  try {
    const rows = await prisma.systemConfig.findMany({ where: { group } });
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value;
    // Fill in any missing keys with env fallbacks
    for (const [k, v] of Object.entries(ENV_FALLBACKS)) {
      if (k.startsWith(group + ".") && !(k in result) && v !== undefined) {
        result[k] = v;
      }
    }
    return result;
  } catch {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(ENV_FALLBACKS)) {
      if (k.startsWith(group + ".") && v !== undefined) result[k] = v;
    }
    return result;
  }
}

export function configInvalidate(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

// Schema definition for admin UI — describes every managed config key
export const CONFIG_SCHEMA: Array<{
  key: string;
  group: string;
  label: string;
  description?: string;
  sensitive?: boolean;
  valueType: "string" | "number" | "boolean";
}> = [
  // AI
  { key: "ai.anthropic.apiKey",   group: "ai", label: "Anthropic API Key",      sensitive: true,  valueType: "string" },
  { key: "ai.openai.apiKey",      group: "ai", label: "OpenAI API Key",          sensitive: true,  valueType: "string" },
  { key: "ai.deepseek.apiKey",    group: "ai", label: "DeepSeek API Key",        sensitive: true,  valueType: "string" },
  { key: "ai.defaultProvider",    group: "ai", label: "Default AI Provider",     description: "anthropic or openai", valueType: "string" },
  { key: "ai.parse.provider",     group: "ai", label: "Resume Parser Provider",  description: "anthropic | openai | deepseek", valueType: "string" },
  { key: "ai.model.review",       group: "ai", label: "Model — AI Review",       valueType: "string" },
  { key: "ai.model.tailor",       group: "ai", label: "Model — Tailoring",       valueType: "string" },
  { key: "ai.model.chat",         group: "ai", label: "Model — Chat",            valueType: "string" },
  { key: "ai.model.parse",        group: "ai", label: "Model — Resume Parser",   valueType: "string" },
  // Stripe
  { key: "stripe.secretKey",      group: "stripe", label: "Stripe Secret Key",       sensitive: true, valueType: "string" },
  { key: "stripe.publishableKey", group: "stripe", label: "Stripe Publishable Key",  valueType: "string" },
  { key: "stripe.webhookSecret",  group: "stripe", label: "Stripe Webhook Secret",   sensitive: true, valueType: "string" },
  { key: "stripe.price.basic.monthly",      group: "stripe", label: "Price ID — Basic Monthly",      valueType: "string" },
  { key: "stripe.price.basic.yearly",       group: "stripe", label: "Price ID — Basic Yearly",       valueType: "string" },
  { key: "stripe.price.pro.monthly",        group: "stripe", label: "Price ID — Pro Monthly",        valueType: "string" },
  { key: "stripe.price.pro.yearly",         group: "stripe", label: "Price ID — Pro Yearly",         valueType: "string" },
  { key: "stripe.price.enterprise.monthly", group: "stripe", label: "Price ID — Enterprise Monthly", valueType: "string" },
  { key: "stripe.price.enterprise.yearly",  group: "stripe", label: "Price ID — Enterprise Yearly",  valueType: "string" },
  // Tiers
  { key: "tiers.free.maxResumes",       group: "tiers", label: "Free — Max Resumes",          valueType: "number" },
  { key: "tiers.free.aiOpsPerMonth",    group: "tiers", label: "Free — AI Ops / Month",       valueType: "number" },
  { key: "tiers.basic.maxResumes",      group: "tiers", label: "Basic — Max Resumes",         valueType: "number" },
  { key: "tiers.basic.aiOpsPerMonth",   group: "tiers", label: "Basic — AI Ops / Month",      valueType: "number" },
  { key: "tiers.pro.maxResumes",        group: "tiers", label: "Pro — Max Resumes",           valueType: "number" },
  { key: "tiers.pro.aiOpsPerMonth",     group: "tiers", label: "Pro — AI Ops / Month",        valueType: "number" },
  { key: "tiers.enterprise.maxResumes",     group: "tiers", label: "Enterprise — Max Resumes",    valueType: "number" },
  { key: "tiers.enterprise.aiOpsPerMonth",  group: "tiers", label: "Enterprise — AI Ops / Month", valueType: "number" },
  // Features
  { key: "features.aiReview",           group: "features", label: "AI Review",             valueType: "boolean" },
  { key: "features.aiTailor",           group: "features", label: "AI Tailoring",          valueType: "boolean" },
  { key: "features.jobSearch",          group: "features", label: "Job Search",            valueType: "boolean" },
  { key: "features.resumeParser",       group: "features", label: "Resume Parser",         valueType: "boolean" },
  { key: "features.exportDocx",         group: "features", label: "DOCX Export",           valueType: "boolean" },
  { key: "features.maintenance",        group: "features", label: "Maintenance Mode",      valueType: "boolean" },
  { key: "features.maintenanceMessage", group: "features", label: "Maintenance Message",   valueType: "string" },
  // App
  { key: "app.name",         group: "app", label: "App Name",        valueType: "string" },
  { key: "app.url",          group: "app", label: "App URL",         valueType: "string" },
  { key: "app.supportEmail", group: "app", label: "Support Email",   valueType: "string" },
  { key: "app.trialDays",    group: "app", label: "Trial Days",      valueType: "number" },
];

