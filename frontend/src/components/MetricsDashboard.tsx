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
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading metrics…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800 rounded-xl p-5 text-red-400 text-sm">
        <strong>Error loading metrics:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">A/B Test Metrics</h2>
          <p className="text-slate-400 text-sm mt-0.5">Comparing display variant performance</p>
        </div>
        {lastRefreshed && (
          <span className="text-xs text-slate-500">
            Last updated {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

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
