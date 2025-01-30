"use client";

import { useState, useEffect } from "react";
import promptsConfig from "../../prompts/prompts.json";
import { OpenAIService } from "../services/openai";
import { type Config } from "../types/config";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const config = promptsConfig as Config;

interface MetricsData {
  tokenUsage: number;
  latency: number;
  inferenceSpeed: number;
  computeCost: number;
}

interface PromptResult {
  promptId: string;
  metrics: MetricsData;
  output: string;
  variables: string;
}

const OutputDisplay = ({ output }: { output: string }) => {
  return (
    <div className="prose max-w-none p-4 bg-gray-100 rounded-md">
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{output}</ReactMarkdown>
    </div>
  );
};

const MainVariableDisplay = ({
  variable,
  onValueChange,
}: {
  variable: { name: string; value: string };
  onValueChange: (value: string) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold">Main Variable: {variable.name}</h3>
      <textarea
        className="mt-2 w-full p-2 border rounded"
        value={variable.value}
        onChange={(e) => onValueChange(e.target.value)}
        rows={4}
      />
    </div>
  );
};

const MetricsDisplay = ({ metrics }: { metrics: MetricsData }) => {
  return (
    <div className="grid grid-row-4 gap-4">
      <div>
        <span className="font-medium">Token Usage:</span>
        <span className="ml-2">{metrics.tokenUsage}</span>
      </div>
      <div>
        <span className="font-medium">Latency:</span>
        <span className="ml-2">{metrics.latency}ms</span>
      </div>
      <div>
        <span className="font-medium">Speed:</span>
        <span className="ml-2">{metrics.inferenceSpeed.toFixed(1)} tok/s</span>
      </div>
      <div>
        <span className="font-medium">Cost:</span>
        <span className="ml-2">${metrics.computeCost.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default function CompareView() {
  const CACHE_KEY = "promptResults";
  const VARIABLES_CACHE_KEY = "promptVariables";

  const [results, setResults] = useState<PromptResult[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [promptStates, setPromptStates] = useState<Record<string, string>>({});

  const firstPrompt = config.prompts[0];
  const mainVariable = firstPrompt?.variables.find((v) => v.isMain);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedVariables = localStorage.getItem(VARIABLES_CACHE_KEY);
    if (cached) {
      setResults(JSON.parse(cached));
    }
    if (cachedVariables) {
      setVariables(JSON.parse(cachedVariables));
    }
  }, []);

  useEffect(() => {
    const initialPromptStates = Object.fromEntries(
      config.prompts.map((prompt) => [prompt.id, prompt.template])
    );
    setPromptStates(initialPromptStates);
  }, []);

  const handleRunPrompt = async (promptId: string) => {
    setIsLoading((prev) => ({ ...prev, [promptId]: true }));
    setError(null);

    try {
      const service = new OpenAIService(apiKey);
      const result = await service.runPrompt(promptId, variables, config);
      const resultWithVars = {
        ...result,
        variables: JSON.stringify(variables),
      };

      setResults((prev) => {
        const newResults = [...prev];
        const index = newResults.findIndex((r) => r.promptId === promptId);
        if (index >= 0) {
          newResults[index] = resultWithVars;
        } else {
          newResults.push(resultWithVars);
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(newResults));
        return newResults;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading((prev) => ({ ...prev, [promptId]: false }));
    }
  };

  const handleMainVariableChange = (value: string) => {
    if (mainVariable) {
      const newVariables = {
        ...variables,
        [mainVariable.name]: value,
      };
      setVariables(newVariables);
      localStorage.setItem(VARIABLES_CACHE_KEY, JSON.stringify(newVariables));
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI API Key
        </label>
        <input
          type="password"
          className="w-full p-2 border rounded-md"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      {mainVariable && (
        <MainVariableDisplay
          variable={{
            name: mainVariable.name,
            value: variables[mainVariable.name] || "",
          }}
          onValueChange={handleMainVariableChange}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Prompts
              </th>
              {config.prompts.map((prompt) => (
                <th
                  key={prompt.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="">
                    <div className="whitespace-pre-wrap">
                      {typeof prompt.template === "string"
                        ? prompt.template
                        : prompt.template.join("\n")}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                Variables
              </td>
              {config.prompts.map((prompt) => (
                <td key={prompt.id} className="px-6 py-4">
                  {prompt.variables
                    .map(
                      (v) =>
                        `${v.name}: ${variables[v.name] || v.default || ""}`
                    )
                    .join(", ")}
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trigger
              </th>
              {config.prompts.map((prompt) => (
                <th
                  key={prompt.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="">
                    <button
                      onClick={() => handleRunPrompt(prompt.id)}
                      disabled={isLoading[prompt.id]}
                      className={`ml-2 px-3 py-1 rounded text-white ${
                        isLoading[prompt.id]
                          ? "bg-gray-400"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {isLoading[prompt.id] ? "Running..." : "Re-run"}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                Metrics
              </td>
              {config.prompts.map((prompt) => (
                <td key={prompt.id} className="px-6 py-4 whitespace-nowrap">
                  {results.find((r) => r.promptId === prompt.id)?.metrics ? (
                    <MetricsDisplay
                      metrics={
                        results.find((r) => r.promptId === prompt.id)!.metrics
                      }
                    />
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                Output
              </td>
              {config.prompts.map((prompt) => (
                <td key={prompt.id} className="px-6 py-4 whitespace-normal">
                  {isLoading[prompt.id] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <OutputDisplay
                      output={
                        results.find((r) => r.promptId === prompt.id)?.output ||
                        "No output"
                      }
                    />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
