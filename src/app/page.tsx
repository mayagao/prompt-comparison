"use client";

import { useState } from "react";
import CompareView from "./components/compareView";

export default function Home() {
  const [activeTab, setActiveTab] = useState("compare");

  return (
    <main className="px-5 mx-auto py-4">
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("compare")}
              className={`py-2 font-medium ${
                activeTab === "compare"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => setActiveTab("cot")}
              className={`py-2 font-medium ${
                activeTab === "evaluate"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              CoT
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === "compare" && <CompareView />}
          {activeTab === "cot" && (
            <div className="">Visualize chain of thoughts</div>
          )}
        </div>
      </div>
    </main>
  );
}
