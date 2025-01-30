import OpenAI from "openai";
import { type ModelConfig, type PromptResult } from "../types";

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateCompletion(
    prompt: string,
    config: ModelConfig
  ): Promise<PromptResult> {
    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate metrics
      const tokenUsage = completion.usage?.total_tokens || 0;
      const inferenceSpeed = tokenUsage / (latency / 1000); // tokens per second

      // Rough cost estimation (you might want to make this more accurate)
      const computeCost = tokenUsage * 0.00002; // Example rate, adjust as needed

      return {
        promptId: prompt, // You might want to pass this in separately
        metrics: {
          tokenUsage,
          latency,
          inferenceSpeed,
          computeCost,
        },
        output: completion.choices[0]?.message?.content || "",
      };
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw error;
    }
  }
}
