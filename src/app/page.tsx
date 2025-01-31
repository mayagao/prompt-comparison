"use client";

import { useState } from "react";
import CompareView from "./components/compareView";

export default function Home() {
  const [activeTab, setActiveTab] = useState("compare");

  return (
    <main className="px-2 mx-auto py-6">
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("compare")}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "compare"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => setActiveTab("evaluate")}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "evaluate"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Evaluate
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "compare" && <CompareView />}
          {activeTab === "evaluate" && (
            <div className="p-4">Evaluate tab content will go here</div>
          )}
        </div>
      </div>
    </main>
  );
}
