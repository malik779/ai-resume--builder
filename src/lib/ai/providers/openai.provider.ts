import OpenAI from "openai";
import { BaseAIProvider } from "./base.provider";

// Free tier: GPT-4o-mini — cheapest capable model, ~$0.15/1M input tokens
export class OpenAIProvider extends BaseAIProvider {
  readonly modelId = "gpt-4o-mini";
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  protected async callModel(system: string, user: string) {
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    return {
      text: response.choices[0]?.message?.content ?? "{}",
      promptTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }
}

let _instance: OpenAIProvider | null = null;
export const openAIProvider = (): OpenAIProvider => (_instance ??= new OpenAIProvider());
