export interface ModelConfig {
  provider: "openai" | "anthropic" | "other";
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface Variable {
  name: string;
  description: string;
  type: "string" | "number" | "boolean";
  isMain: boolean;
  options?: string[];
  default?: string | number | boolean;
}

export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: Variable[];
  modelConfig: string; // reference to model configuration
}

export interface Config {
  models: {
    [key: string]: {
      provider: string;
      model: string;
      temperature: number;
      max_tokens: number;
    };
  };
  prompts: Array<{
    id: string;
    name: string;
    description: string;
    template: string;
    variables: Array<{
      name: string;
      description: string;
      type: string;
      isMain: boolean;
      options?: string[];
      default?: string;
    }>;
    modelConfig: string;
  }>;
}
