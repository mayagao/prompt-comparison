import OpenAI from "openai";
import { Config } from "../types/config";

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  async runPrompt(
    promptId: string,
    variables: Record<string, string>,
    config: Config
  ) {
    const prompt = config.prompts.find((p) => p.id === promptId);
    if (!prompt) {
      throw new Error(`Prompt ${promptId} not found`);
    }

    const modelConfig = config.models[prompt.modelConfig];
    if (!modelConfig) {
      throw new Error(`Model config ${prompt.modelConfig} not found`);
    }

    // Replace variables in template
    let filledTemplate =
      typeof prompt.template === "string"
        ? prompt.template
        : prompt.template.join("\n");
    Object.entries(variables).forEach(([key, value]) => {
      filledTemplate = filledTemplate.replace(`{${key}}`, value);
    });

    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: modelConfig.model,
        messages: [{ role: "user", content: filledTemplate }],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate metrics
      const tokenUsage = completion.usage?.total_tokens || 0;
      const inferenceSpeed = tokenUsage / (latency / 1000); // tokens per second

      // Rough cost estimation
      const computeCost = tokenUsage * 0.00002;

      return {
        promptId,
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
