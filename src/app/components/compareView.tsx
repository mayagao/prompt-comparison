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
  scenarioId: number;
}

const OutputDisplay = ({ output }: { output: string }) => {
  return (
    <div className="prose max-w-none p-4 bg-gray-100 rounded-md">
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{output}</ReactMarkdown>
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

const getAllVariables = () => {
  const variableMap = new Map<
    string,
    {
      name: string;
      description: string;
      isMain: boolean;
      promptIds: string[];
    }
  >();

  config.prompts.forEach((prompt) => {
    prompt.variables.forEach((v) => {
      if (variableMap.has(v.name)) {
        const existing = variableMap.get(v.name)!;
        if (!existing.promptIds.includes(prompt.id)) {
          existing.promptIds.push(prompt.id);
        }
        if (!existing.description.includes(v.description)) {
          existing.description += `\n${v.description}`;
        }
        existing.isMain = existing.isMain || v.isMain;
      } else {
        variableMap.set(v.name, {
          name: v.name,
          description: v.description,
          isMain: v.isMain,
          promptIds: [prompt.id],
        });
      }
    });
  });

  return Array.from(variableMap.values());
};

export default function CompareView() {
  const CACHE_KEY = "promptResults";
  const VARIABLES_CACHE_KEY = "promptVariables";
  const SCENARIOS = [0, 1, 2]; // Three scenarios

  const [results, setResults] = useState<PromptResult[]>([]);
  const [variables, setVariables] = useState<
    Record<string, Record<number, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [promptStates, setPromptStates] = useState<Record<string, string>>({});

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

  const handleRunPrompt = async (promptId: string, scenarioId: number) => {
    setIsLoading((prev) => ({ ...prev, [`${promptId}-${scenarioId}`]: true }));
    setError(null);

    try {
      const service = new OpenAIService(apiKey);
      const scenarioVariables = Object.fromEntries(
        Object.entries(variables).map(([key, value]) => [
          key,
          value[scenarioId] || "",
        ])
      );
      const result = await service.runPrompt(
        promptId,
        scenarioVariables,
        config
      );
      const resultWithVars = {
        ...result,
        variables: JSON.stringify(scenarioVariables),
        scenarioId,
      };

      setResults((prev) => {
        const newResults = [...prev];
        const index = newResults.findIndex(
          (r) => r.promptId === promptId && r.scenarioId === scenarioId
        );
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
      setIsLoading((prev) => ({
        ...prev,
        [`${promptId}-${scenarioId}`]: false,
      }));
    }
  };

  const handleVariableChange = (
    variableName: string,
    value: string,
    scenarioId: number
  ) => {
    setVariables((prev) => {
      const newVariables = {
        ...prev,
        [variableName]: {
          ...prev[variableName],
          [scenarioId]: value,
        },
      };
      localStorage.setItem(VARIABLES_CACHE_KEY, JSON.stringify(newVariables));
      return newVariables;
    });
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

      <div className="overflow-x-auto grid grid-cols-5">
        <div className="w-1/4 min-w-[300px]">
          <div className="h-[300px]"></div>
          {SCENARIOS.map((scenarioId) => (
            <div key={scenarioId} className="mb-8">
              <h3 className="text-md font-semibold mb-4">
                Scenario {scenarioId + 1}
              </h3>
              <div className="space-y-4">
                {getAllVariables().map((variable) => (
                  <div
                    key={`${variable.name}-${scenarioId}`}
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <h3 className="text-md font-semibold">{variable.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {variable.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Used in:{" "}
                      {variable.promptIds
                        .map((id) => {
                          const prompt = config.prompts.find(
                            (p) => p.id === id
                          );
                          return prompt?.name || id;
                        })
                        .join(", ")}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <textarea
                          className="w-full p-2 border rounded text-sm"
                          value={variables[variable.name]?.[scenarioId] || ""}
                          onChange={(e) =>
                            handleVariableChange(
                              variable.name,
                              e.target.value,
                              scenarioId
                            )
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="flex divide-gray-200 truncate">
            {config.prompts.map((prompt) => (
              <div className="" key={prompt.id}>
                {prompt.name}
                <div className="whitespace-pre-wrap">
                  {typeof prompt.template === "string"
                    ? prompt.template
                    : prompt.template.join("\n")}
                </div>
              </div>
            ))}
          </div>
          {SCENARIOS.map((scenarioId) => (
            <div key={scenarioId} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                Scenario {scenarioId + 1}
              </h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {config.prompts.map((prompt) => (
                      <th
                        key={prompt.id}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="">{prompt.name}</div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {config.prompts.map((prompt) => (
                      <td key={prompt.id} className="px-6 py-4">
                        {prompt.variables
                          .map(
                            (v) =>
                              `${v.name}: ${
                                variables[v.name]?.[scenarioId] ||
                                v.default ||
                                ""
                              }`
                          )
                          .join(", ")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {config.prompts.map((prompt) => (
                      <th
                        key={prompt.id}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="">
                          <button
                            onClick={() =>
                              handleRunPrompt(prompt.id, scenarioId)
                            }
                            disabled={isLoading[`${prompt.id}-${scenarioId}`]}
                            className={`ml-2 px-3 py-1 rounded text-white ${
                              isLoading[`${prompt.id}-${scenarioId}`]
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {isLoading[`${prompt.id}-${scenarioId}`]
                              ? "Running..."
                              : "Re-run"}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    {config.prompts.map((prompt) => (
                      <td
                        key={prompt.id}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {results.find(
                          (r) =>
                            r.promptId === prompt.id &&
                            r.scenarioId === scenarioId
                        )?.metrics ? (
                          <MetricsDisplay
                            metrics={
                              results.find(
                                (r) =>
                                  r.promptId === prompt.id &&
                                  r.scenarioId === scenarioId
                              )!.metrics
                            }
                          />
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                        {prompt.modelConfig}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {config.prompts.map((prompt) => (
                      <td
                        key={prompt.id}
                        className="px-6 py-4 whitespace-normal"
                      >
                        {isLoading[`${prompt.id}-${scenarioId}`] ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : (
                          <OutputDisplay
                            output={
                              results.find(
                                (r) =>
                                  r.promptId === prompt.id &&
                                  r.scenarioId === scenarioId
                              )?.output || "No output"
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
