import yaml from "js-yaml";
import { Config, PromptConfig } from "../types/config";

export class ConfigLoader {
  private config: Config | null = null;

  async loadConfig(configPath: string): Promise<Config> {
    try {
      const response = await fetch(configPath);
      const yamlText = await response.text();
      this.config = yaml.load(yamlText) as Config;
      return this.config;
    } catch (error) {
      console.error("Error loading config:", error);
      throw error;
    }
  }

  getPromptConfig(promptId: string): PromptConfig | undefined {
    return this.config?.prompts.find((p) => p.id === promptId);
  }

  getModelConfig(modelId: string) {
    return this.config?.models[modelId];
  }

  interpolateTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
