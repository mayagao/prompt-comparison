"use client";

import { useState } from "react";
import promptsConfig from "../../prompts/prompts.json";
import { type Config } from "../types/config";

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
}

const MainVariableDisplay = ({
  variable,
}: {
  variable: { name: string; value: string };
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold">Main Variable: {variable.name}</h3>
      <p className="mt-2">{variable.value}</p>
    </div>
  );
};

const MetricsDisplay = ({ metrics }: { metrics: MetricsData }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
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
        <span className="ml-2">{metrics.inferenceSpeed} tok/s</span>
      </div>
      <div>
        <span className="font-medium">Cost:</span>
        <span className="ml-2">${metrics.computeCost.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default function CompareView() {
  const [results, setResults] = useState<PromptResult[]>([]);

  // Get the main variable from the first prompt
  const firstPrompt = config.prompts[0];
  const mainVariable = firstPrompt?.variables.find((v) => v.isMain);

  return (
    <div className="p-4">
      {mainVariable && (
        <MainVariableDisplay
          variable={{
            name: mainVariable.name,
            value: mainVariable.default || "",
          }}
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
                  {prompt.template}
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
                  {results.find((r) => r.promptId === prompt.id)?.output || (
                    <span className="text-gray-400">No output</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                Variables
              </td>
              {config.prompts.map((prompt) => (
                <td key={prompt.id} className="px-6 py-4 whitespace-nowrap">
                  {prompt.variables
                    .filter((v) => !v.isMain)
                    .map((v) => `${v.name}: ${v.default || ""}`)
                    .join(", ")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
