// Lightweight parse client factory — reads provider + model from admin config at request time.
// PDF text extraction always uses Anthropic (requires document vision).
// JSON parsing uses whichever provider the admin has configured.

import { configGet } from "@/lib/config-service";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface ParseClient {
  readonly provider: string;
  readonly modelId: string;
  complete(system: string, user: string): Promise<string>;
}

export async function createParseClient(): Promise<ParseClient> {
  const [provider, model] = await Promise.all([
    configGet("ai.parse.provider"),
    configGet("ai.model.parse"),
  ]);

  const resolvedProvider = provider ?? "anthropic";

  switch (resolvedProvider) {
    case "openai": {
      const resolvedModel = model ?? "gpt-4o-mini";
      const apiKey = (await configGet("ai.openai.apiKey")) ?? process.env.OPENAI_API_KEY;
      const client = new OpenAI({ apiKey });
      return {
        provider: "openai",
        modelId: resolvedModel,
        async complete(system, user) {
          const res = await client.chat.completions.create({
            model: resolvedModel,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.1,
          });
          return res.choices[0]?.message?.content ?? "{}";
        },
      };
    }

    case "deepseek": {
      // DeepSeek uses an OpenAI-compatible REST API
      const resolvedModel = model?.startsWith("deepseek") ? model : "deepseek-chat";
      const apiKey = (await configGet("ai.deepseek.apiKey")) ?? process.env.DEEPSEEK_API_KEY;
      const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
      return {
        provider: "deepseek",
        modelId: resolvedModel,
        async complete(system, user) {
          const res = await client.chat.completions.create({
            model: resolvedModel,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.1,
          });
          return res.choices[0]?.message?.content ?? "{}";
        },
      };
    }

    case "anthropic":
    default: {
      const resolvedModel = model ?? "claude-haiku-4-5-20251001";
      const apiKey = (await configGet("ai.anthropic.apiKey")) ?? process.env.ANTHROPIC_API_KEY;
      const client = new Anthropic({ apiKey });
      return {
        provider: "anthropic",
        modelId: resolvedModel,
        async complete(system, user) {
          const res = await client.messages.create({
            model: resolvedModel,
            max_tokens: 4000,
            system,
            messages: [{ role: "user", content: user }],
          });
          return res.content[0].type === "text" ? res.content[0].text : "{}";
        },
      };
    }
  }
}
