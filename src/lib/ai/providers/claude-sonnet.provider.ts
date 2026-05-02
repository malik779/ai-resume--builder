import Anthropic from "@anthropic-ai/sdk";
import { BaseAIProvider } from "./base.provider";

// Enterprise tier: Claude Sonnet — highest quality, ~$3/1M input tokens
// Uses prompt caching for long system prompts to cut costs by ~90% on repeat calls
export class ClaudeSonnetProvider extends BaseAIProvider {
  readonly modelId = "claude-sonnet-4-6";
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  protected async callModel(system: string, user: string) {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 8192,
      // Cache the system prompt — system prompts are stable across calls, this
      // saves ~90% cost on subsequent requests for the same operation type.
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: user }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return {
      text,
      promptTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}

let _instance: ClaudeSonnetProvider | null = null;
export const claudeSonnetProvider = (): ClaudeSonnetProvider => (_instance ??= new ClaudeSonnetProvider());
