import React, { useState, useEffect } from "react";
import { AppShell } from "../components/AppShell.js";
import { ConnectionForm } from "../components/ConnectionForm.js";
import { RecommendationList } from "../components/RecommendationList.js";
import { useVariant } from "../hooks/useVariant.js";
import { useAnalysis } from "../hooks/useAnalysis.js";
import type { GlobalStats } from "../types/index.js";

export function AnalysePage(): React.ReactElement {
  const { variant, sessionId } = useVariant();
  const { result, loading, error, analyse, analyseSample, analyseFile } = useAnalysis();
  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);

  function fetchStats(): void {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: GlobalStats) => {
        // Guard: API may return an error shape (e.g. DB unreachable) where
        // totalAnalyses is missing. Keep state null so the banner stays hidden.
        if (typeof d.totalAnalyses === "number") setTotalAnalyses(d.totalAnalyses);
      })
      .catch(() => { /* silent */ });
  }

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (result !== null) fetchStats(); }, [result]);

  return (
    <AppShell>
      {/* Global usage counter banner */}
      {totalAnalyses !== null && (
        <div className="border border-slate-800/60 bg-slate-900/35 backdrop-blur-sm rounded-lg mb-6">
          <p className="px-6 py-2 text-center text-xs text-slate-500">
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

      <div className="space-y-6">
        {/* Hero banner — hidden while loading or showing results */}
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
            <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
              <span>Database: <span className="text-slate-300 font-mono">{result.databaseName}</span></span>
              <span>·</span>
              <span>{result.collectionsAnalysed} collection{result.collectionsAnalysed !== 1 ? "s" : ""} analysed</span>
              <span>·</span>
              <span>{new Date(result.analysedAt).toLocaleTimeString()}</span>
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
    </AppShell>
  );
}
