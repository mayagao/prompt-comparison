"use client";

import { useState } from "react";
import {
  type Prompt,
  type PromptResult,
  type Variable,
  type MetricsData,
} from "../types";
import promptsConfig from "../../prompts/prompts.yaml";
import { type Config } from "../types/config";
const config = promptsConfig as Config;

// Sample data - will be moved to configuration later
const samplePrompts: Prompt[] = [
  {
    id: "prompt1",
    template: "Summarize this {text} in {style} style",
    variables: [
      { name: "text", isMain: true, value: "sample text" },
      { name: "style", isMain: false, value: "concise" },
    ],
  },
  {
    id: "prompt2",
    template: "Analyze the sentiment of {text}",
    variables: [{ name: "text", isMain: true, value: "sample text" }],
  },
];

interface MainVariableDisplayProps {
  variable: Variable;
}

const MainVariableDisplay = ({ variable }: MainVariableDisplayProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold">Main Variable: {variable.name}</h3>
      <p className="mt-2">{variable.value}</p>
    </div>
  );
};

interface MetricsDisplayProps {
  metrics: MetricsData;
}

const MetricsDisplay = ({ metrics }: MetricsDisplayProps) => {
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
  const mainVariable = samplePrompts[0].variables.find((v) => v.isMain);

  return (
    <div className="p-4">
      {mainVariable && <MainVariableDisplay variable={mainVariable} />}

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
              {samplePrompts.map((prompt) => (
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
              {samplePrompts.map((prompt) => (
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
              {samplePrompts.map((prompt) => (
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
              {samplePrompts.map((prompt) => (
                <td key={prompt.id} className="px-6 py-4 whitespace-nowrap">
                  {prompt.variables
                    .filter((v) => !v.isMain)
                    .map((v) => `${v.name}: ${v.value}`)
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
