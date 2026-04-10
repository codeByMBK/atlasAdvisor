import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { VariantMetrics } from "../types/index.js";

const REFRESH_INTERVAL_MS = 30_000;

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function MetricsDashboard(): React.ReactElement {
  const [metrics, setMetrics] = useState<VariantMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Reset All state
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as VariantMetrics[];
      setMetrics(data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 30s auto-refresh
  useEffect(() => {
    void fetchMetrics();
    const timer = setInterval(() => { void fetchMetrics(); }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchMetrics]);

  async function handleResetAll(): Promise<void> {
    setResetting(true);
    setConfirmReset(false);
    try {
      const res = await fetch("/api/metrics", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResetMessage("All metrics cleared");
      setTimeout(() => setResetMessage(null), 3000);
      await fetchMetrics();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to clear metrics";
      setResetMessage(`Error: ${msg}`);
    } finally {
      setResetting(false);
    }
  }

  // Shape data for recharts
  const chartData = [
    {
      name: "Click-Through Rate",
      "Variant A": metrics.find((m) => m.variant === "A")?.clickThroughRate ?? 0,
      "Variant B": metrics.find((m) => m.variant === "B")?.clickThroughRate ?? 0,
    },
    {
      name: "Apply Rate",
      "Variant A": metrics.find((m) => m.variant === "A")?.applyRate ?? 0,
      "Variant B": metrics.find((m) => m.variant === "B")?.applyRate ?? 0,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-label="Loading metrics">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-36 bg-slate-700 rounded" />
            <div className="h-3 w-56 bg-slate-800 rounded" />
          </div>
          <div className="h-7 w-28 bg-slate-700 rounded-md" />
        </div>
        {/* Table skeleton */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="border-b border-slate-700 px-5 py-3 flex gap-8">
            {[80, 60, 60, 60, 60, 70].map((w, i) => (
              <div key={i} className={`h-3 bg-slate-700 rounded`} style={{ width: w }} />
            ))}
          </div>
          {[1, 2].map((row) => (
            <div key={row} className="border-b border-slate-700/50 px-5 py-4 flex gap-8">
              {[80, 60, 60, 60, 60, 70].map((w, i) => (
                <div key={i} className="h-4 bg-slate-700/60 rounded" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="h-4 w-40 bg-slate-700 rounded mb-5" />
          <div className="h-60 bg-slate-700/30 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800 rounded-xl p-5 text-red-400 text-sm flex items-center justify-between gap-4">
        <span><strong>Error loading metrics:</strong> {error}</span>
        <button
          type="button"
          onClick={() => { void fetchMetrics(); }}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-red-900/60 hover:bg-red-800/80 text-red-300 border border-red-800/50 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // No events recorded yet
  const hasData = metrics.some((m) => m.totalSessions > 0);
  if (!hasData) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">No data yet</h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Run an analysis on the Analyse tab to start recording A/B test events. Metrics will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">A/B Test Metrics</h2>
          <p className="text-slate-400 text-sm mt-0.5">Comparing display variant performance</p>
        </div>

        {/* Action buttons + timestamp */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {lastRefreshed && (
            <span className="text-xs text-slate-500">
              Last updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={resetting}
              className="text-xs px-3 py-1.5 rounded-md bg-red-900/60 hover:bg-red-800/80 text-red-300 border border-red-800/50 transition-colors disabled:opacity-50"
            >
              {resetting ? "Clearing…" : "Reset All Metrics"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmReset && (
        <div className="bg-slate-800 border border-red-800/60 rounded-xl p-4 flex items-center justify-between gap-4 animate-fade-in">
          <p className="text-sm text-slate-300">
            This will delete <span className="text-white font-medium">all A/B test data</span>. Are you sure?
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleResetAll()}
              className="text-xs px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Yes, reset
            </button>
          </div>
        </div>
      )}

      {/* Success/error message */}
      {resetMessage && (
        <div className={`text-xs text-center py-2 px-4 rounded-lg animate-fade-in ${
          resetMessage.startsWith("Error")
            ? "bg-red-950/50 text-red-400 border border-red-800"
            : "bg-slate-800 text-slate-400 border border-slate-700"
        }`}>
          {resetMessage}
        </div>
      )}

      {/* Summary table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 text-xs uppercase tracking-wider px-5 py-3">Variant</th>
              <th className="text-right text-slate-400 text-xs uppercase tracking-wider px-5 py-3">Sessions</th>
              <th className="text-right text-slate-400 text-xs uppercase tracking-wider px-5 py-3">Views</th>
              <th className="text-right text-slate-400 text-xs uppercase tracking-wider px-5 py-3">Clicks</th>
              <th className="text-right text-slate-400 text-xs uppercase tracking-wider px-5 py-3">CTR</th>
              <th className="text-right text-slate-400 text-xs uppercase tracking-wider px-5 py-3">Apply Rate</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => (
              <tr
                key={m.variant}
                className={`${idx < metrics.length - 1 ? "border-b border-slate-700/50" : ""} hover:bg-slate-700/30 transition-colors`}
              >
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-2 font-semibold ${m.variant === "A" ? "text-brand-500" : "text-purple-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${m.variant === "A" ? "bg-brand-500" : "bg-purple-400"}`} />
                    Variant {m.variant}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-white font-mono">{m.totalSessions}</td>
                <td className="px-5 py-3.5 text-right text-white font-mono">{m.totalViews}</td>
                <td className="px-5 py-3.5 text-right text-white font-mono">{m.totalClicks}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`font-semibold font-mono ${m.clickThroughRate > 0.3 ? "text-brand-500" : "text-slate-300"}`}>
                    {pct(m.clickThroughRate)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`font-semibold font-mono ${m.applyRate > 0.2 ? "text-brand-500" : "text-slate-300"}`}>
                    {pct(m.applyRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-5">Engagement Comparison</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => pct(v)}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
              formatter={(value: number) => [pct(value), ""]}
            />
            <Legend
              wrapperStyle={{ color: "#94a3b8", fontSize: "12px", paddingTop: "16px" }}
            />
            <Bar dataKey="Variant A" fill="#00ED64" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Variant B" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-4 text-center">
          Variant A shows recommendations sorted by severity · Variant B groups by category
        </p>
      </div>
    </div>
  );
}
