import React, { useState, useEffect } from "react";
import { ConnectionForm } from "./components/ConnectionForm.js";
import { RecommendationList } from "./components/RecommendationList.js";
import { MetricsDashboard } from "./components/MetricsDashboard.js";
import { useVariant } from "./hooks/useVariant.js";
import { useAnalysis } from "./hooks/useAnalysis.js";
import type { GlobalStats } from "./types/index.js";

type Tab = "analyse" | "metrics";

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("analyse");
  const { variant, sessionId } = useVariant();
  const { result, loading, error, analyse, analyseSample, analyseFile } = useAnalysis();

  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);

  function fetchStats(): void {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: GlobalStats) => setTotalAnalyses(d.totalAnalyses))
      .catch(() => { /* silent */ });
  }

  // Fetch global stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Re-fetch actual count from server after each successful analysis
  useEffect(() => {
    if (result !== null) {
      fetchStats();
    }
  }, [result]);

  return (
    <div className="relative min-h-screen text-white font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-500 focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm">
        Skip to main content
      </a>
      {/* Subtle full-page backdrop (PrimaryImage); OG/social preview uses the same asset in index.html */}
      <div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <img
          src="/PrimaryImage.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.28] sm:opacity-[0.32] motion-reduce:opacity-25"
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/55 to-slate-950" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 supports-[backdrop-filter]:bg-slate-900/75">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="AtlasAdvisor logo"
                className="w-9 h-9 rounded-lg object-cover"
              />
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
                  aria-current={activeTab === tab ? "page" : undefined}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                    activeTab === tab
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "analyse" ? "\u26A1 Analyse" : "\uD83D\uDCCA Metrics"}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Global usage counter banner */}
        {totalAnalyses !== null && (
          <div className="border-b border-slate-800/60 bg-slate-900/35 backdrop-blur-sm">
            <p className="max-w-5xl mx-auto px-6 py-2 text-center text-xs text-slate-500">
              {totalAnalyses === 0
                ? "Be the first to analyse a database with AtlasAdvisor"
                : (
                  <>
                    <span className="text-slate-400 font-mono font-medium">{totalAnalyses.toLocaleString()}</span>
                    {" "}database{totalAnalyses !== 1 ? "s" : ""} analysed with AtlasAdvisor
                  </>
                )}
            </p>
          </div>
        )}

        {/* Main content */}
        <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {activeTab === "analyse" && (
            <div className="space-y-6">
              {/* Single hero banner (SecondaryImage); hidden while loading or after results */}
              {!result && !loading && (
                <figure className="rounded-xl overflow-hidden border border-slate-700/90 bg-slate-900/80 shadow-xl ring-1 ring-white/5">
                  <img
                    src="/SecondaryImage.png"
                    alt="AtlasAdvisor — MongoDB optimization insights"
                    className="block w-full h-auto max-h-[min(85vh,52rem)] object-contain object-center bg-slate-950/50"
                  />
                </figure>
              )}

              <ConnectionForm
                onOwnDb={(cs, db) => void analyse(cs, db)}
                onSampleDb={(db) => void analyseSample(db)}
                onUploadFile={(file, col) => void analyseFile(file, col)}
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
    </div>
  );
}

export default App;
