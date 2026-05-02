import Anthropic from "@anthropic-ai/sdk";
import { BaseAIProvider } from "./base.provider";

// Basic tier: Claude Haiku — fast + cheap, ~$0.25/1M input tokens
export class ClaudeHaikuProvider extends BaseAIProvider {
  readonly modelId = "claude-haiku-4-5-20251001";
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  protected async callModel(system: string, user: string) {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 4096,
      system,
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

let _instance: ClaudeHaikuProvider | null = null;
export const claudeHaikuProvider = (): ClaudeHaikuProvider => (_instance ??= new ClaudeHaikuProvider());
