// Define base types for the application
export type Prompt = {
  id: string;
  template: string;
  variables: Variable[];
};

export type Variable = {
  name: string;
  isMain: boolean;
  value: string;
};

export type MetricsData = {
  tokenUsage: number;
  latency: number;
  inferenceSpeed: number;
  computeCost: number;
};

export type PromptResult = {
  promptId: string;
  metrics: MetricsData;
  output: string;
};

export type ModelConfig = {
  provider: "openai" | "anthropic" | "other";
  model: string;
  apiKey: string;
};
