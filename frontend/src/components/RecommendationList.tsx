import React, { useState } from "react";
import type { Recommendation } from "../types/index.js";
import { RecommendationCard } from "./RecommendationCard.js";

interface RecommendationListProps {
  recommendations: Recommendation[];
  collectionsAnalysed: number;
  databaseName: string;
  variant: "A" | "B";
  sessionId: string;
}

const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

type Severity = "HIGH" | "MEDIUM" | "LOW";
type Category = "index" | "schema" | "query";

const ALL_SEVERITIES: Severity[] = ["HIGH", "MEDIUM", "LOW"];
const ALL_CATEGORIES: Category[] = ["index", "schema", "query"];

function sortBySeverity(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

function groupByCategory(recs: Recommendation[]): Record<string, Recommendation[]> {
  return {
    index: recs.filter((r) => r.category === "index"),
    schema: recs.filter((r) => r.category === "schema"),
    query: recs.filter((r) => r.category === "query"),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  index: "Index Recommendations",
  schema: "Schema Recommendations",
  query: "Query Recommendations",
};

const CATEGORY_ICONS: Record<string, string> = {
  index: "⚡",
  schema: "🗂",
  query: "🔍",
};

const SEVERITY_PILL_STYLES: Record<Severity, { on: string; off: string }> = {
  HIGH: {
    on: "bg-red-500/15 text-red-400 border-red-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
  MEDIUM: {
    on: "bg-amber-500/15 text-amber-400 border-amber-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
  LOW: {
    on: "bg-blue-500/15 text-blue-400 border-blue-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
};

const CATEGORY_PILL_STYLES: Record<Category, { on: string; off: string }> = {
  index: {
    on: "bg-purple-500/15 text-purple-400 border-purple-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
  schema: {
    on: "bg-cyan-500/15 text-cyan-400 border-cyan-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
  query: {
    on: "bg-orange-500/15 text-orange-400 border-orange-500/50",
    off: "bg-transparent text-slate-500 border-slate-700 opacity-50",
  },
};

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    if (next.size > 1) next.delete(value); // keep at least one active
  } else {
    next.add(value);
  }
  return next;
}

export function RecommendationList({
  recommendations,
  collectionsAnalysed,
  databaseName,
  variant,
  sessionId,
}: RecommendationListProps): React.ReactElement {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [activeSeverities, setActiveSeverities] = useState<Set<Severity>>(new Set(ALL_SEVERITIES));
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES));

  const visible = recommendations.filter(
    (r) => !dismissed.has(r.id) && activeSeverities.has(r.severity) && activeCategories.has(r.category as Category)
  );
  const highCount = recommendations.filter((r) => r.severity === "HIGH").length;
  const medCount = recommendations.filter((r) => r.severity === "MEDIUM").length;

  function handleDismiss(id: string): void {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function handleApply(id: string): void {
    setApplied((prev) => new Set([...prev, id]));
  }

  const allFiltersActive =
    activeSeverities.size === ALL_SEVERITIES.length &&
    activeCategories.size === ALL_CATEGORIES.length;

  // No collections — database likely doesn't exist or is empty
  if (collectionsAnalysed === 0) {
    return (
      <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-amber-400 font-semibold text-lg mb-1">No collections found</h3>
        <p className="text-slate-400 text-sm">
          <span className="text-white font-mono">{databaseName}</span> has no collections.
          Check that the database name is correct and that it contains data.
        </p>
      </div>
    );
  }

  // Collections exist but no recommendations — genuine health pass
  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-800 border border-brand-500/30 rounded-xl p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-brand-500 font-semibold text-lg mb-1">All clear!</h3>
        <p className="text-slate-400 text-sm">
          No issues detected in <span className="text-white font-mono">{databaseName}</span>.
          Your database looks healthy across {collectionsAnalysed} collection{collectionsAnalysed !== 1 ? "s" : ""}.
        </p>
      </div>
    );
  }

  // Summary bar
  const summaryBar = (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-500" />
        <span className="text-white font-semibold text-sm">
          {visible.length} issue{visible.length !== 1 ? "s" : ""} found
        </span>
        <span className="text-slate-400 text-sm">
          across {collectionsAnalysed} collection{collectionsAnalysed !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        {highCount > 0 && (
          <span className="text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
            {highCount} HIGH
          </span>
        )}
        {medCount > 0 && (
          <span className="text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
            {medCount} MEDIUM
          </span>
        )}
        <span className="text-xs text-slate-500 border border-slate-700 rounded-full px-2 py-1">
          Variant {variant}
        </span>
      </div>
    </div>
  );

  // Filter pills
  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500 mr-1">Filter:</span>
      {ALL_SEVERITIES.map((sev) => (
        <button
          key={sev}
          type="button"
          aria-pressed={activeSeverities.has(sev)}
          onClick={() => setActiveSeverities((prev) => toggle(prev, sev))}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            activeSeverities.has(sev) ? SEVERITY_PILL_STYLES[sev].on : SEVERITY_PILL_STYLES[sev].off
          }`}
        >
          {sev}
        </button>
      ))}
      <span className="text-slate-700 text-xs">·</span>
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          aria-pressed={activeCategories.has(cat)}
          onClick={() => setActiveCategories((prev) => toggle(prev, cat))}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all capitalize focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            activeCategories.has(cat) ? CATEGORY_PILL_STYLES[cat].on : CATEGORY_PILL_STYLES[cat].off
          }`}
        >
          {cat}
        </button>
      ))}
      {!allFiltersActive && (
        <button
          type="button"
          onClick={() => {
            setActiveSeverities(new Set(ALL_SEVERITIES));
            setActiveCategories(new Set(ALL_CATEGORIES));
          }}
          className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 ml-1 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );

  // Variant A: flat list sorted by severity
  if (variant === "A") {
    const sorted = sortBySeverity(visible);
    return (
      <div className="space-y-3 animate-fade-in">
        {summaryBar}
        {filterBar}
        {visible.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">No issues match the active filters.</p>
        )}
        {sorted.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            sessionId={sessionId}
            variant={variant}
            onDismiss={handleDismiss}
            onApply={handleApply}
          />
        ))}
        {applied.size > 0 && (
          <p className="text-center text-xs text-slate-500 pt-2">
            {applied.size} fix{applied.size !== 1 ? "es" : ""} marked as applied
          </p>
        )}
      </div>
    );
  }

  //  Variant B: grouped by category
  const groups = groupByCategory(visible);

  return (
    <div className="space-y-6 animate-fade-in">
      {summaryBar}
      {filterBar}
      {visible.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-6">No issues match the active filters.</p>
      )}
      {(["index", "schema", "query"] as const).map((cat) => {
        const items = groups[cat] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{CATEGORY_ICONS[cat]}</span>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </h3>
              <span className="text-xs text-slate-500 ml-1">({items.length})</span>
            </div>
            <div className="space-y-3">
              {items.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  sessionId={sessionId}
                  variant={variant}
                  onDismiss={handleDismiss}
                  onApply={handleApply}
                />
              ))}
            </div>
          </section>
        );
      })}
      {applied.size > 0 && (
        <p className="text-center text-xs text-slate-500 pt-2">
          {applied.size} fix{applied.size !== 1 ? "es" : ""} marked as applied
        </p>
      )}
    </div>
  );
}
