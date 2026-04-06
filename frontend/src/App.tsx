import React, { useState } from "react";
import { ConnectionForm } from "./components/ConnectionForm.js";
import { RecommendationList } from "./components/RecommendationList.js";
import { MetricsDashboard } from "./components/MetricsDashboard.js";
import { useVariant } from "./hooks/useVariant.js";
import { useAnalysis } from "./hooks/useAnalysis.js";

type Tab = "analyse" | "metrics";

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("analyse");
  const { variant, sessionId } = useVariant();
  const { result, loading, error, analyse } = useAnalysis();

  function handleAnalyse(connectionString: string, databaseName: string): void {
    void analyse(connectionString, databaseName);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/*  Sidebar / Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">AtlasAdvisor</h1>
              <p className="text-slate-500 text-xs mt-0.5">MongoDB Performance Recommender</p>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {(["analyse", "metrics"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab === "analyse" ? "⚡ Analyse" : "📊 Metrics"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/*  Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "analyse" && (
          <div className="space-y-6">
            <ConnectionForm
              onResult={handleAnalyse}
              loading={loading}
              error={error}
            />

            {result && (
              <div className="animate-fade-in">
                {/* Analysis meta info */}
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                  <span>
                    Database:{" "}
                    <span className="text-slate-300 font-mono">{result.databaseName}</span>
                  </span>
                  <span>·</span>
                  <span>
                    {result.collectionsAnalysed} collection
                    {result.collectionsAnalysed !== 1 ? "s" : ""} analysed
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(result.analysedAt).toLocaleTimeString()}
                  </span>
                </div>

                <RecommendationList
                  recommendations={result.recommendations}
                  collectionsAnalysed={result.collectionsAnalysed}
                  databaseName={result.databaseName}
                  variant={variant}
                  sessionId={sessionId}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "metrics" && <MetricsDashboard />}
      </main>
    </div>
  );
}

export default App;
