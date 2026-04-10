import React, { useEffect, useRef, useState } from "react";
import type { Recommendation } from "../types/index.js";

interface RecommendationCardProps {
  recommendation: Recommendation;
  sessionId: string;
  variant: "A" | "B";
  onDismiss?: (id: string) => void;
  onApply?: (id: string) => void;
}

const SEVERITY_STYLES = {
  HIGH: {
    badge: "bg-red-500/15 text-red-400 border border-red-500/30",
    dot: "bg-red-500",
    label: "HIGH",
  },
  MEDIUM: {
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    dot: "bg-amber-500",
    label: "MEDIUM",
  },
  LOW: {
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    dot: "bg-blue-500",
    label: "LOW",
  },
} as const;

const CATEGORY_STYLES = {
  index: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  schema: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  query: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
} as const;

function useCopyToClipboard(text: string): { copied: boolean; copy: () => void } {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copy(): void {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { copied, copy };
}

async function postEvent(
  sessionId: string,
  variant: "A" | "B",
  eventType: string,
  rec: Recommendation
): Promise<void> {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        variant,
        event: eventType,
        recommendationId: rec.id,
        recommendationCategory: rec.category,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("[events] Failed to post:", err);
  }
}

export function RecommendationCard({
  recommendation: rec,
  sessionId,
  variant,
  onDismiss,
  onApply,
}: RecommendationCardProps): React.ReactElement {
  const [showFix, setShowFix] = useState(false);
  const [applied, setApplied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { copied, copy } = useCopyToClipboard(rec.codeExample);

  const sev = SEVERITY_STYLES[rec.severity];
  const cat = CATEGORY_STYLES[rec.category];

  // Fire viewed event once on mount — intentionally omitting deps to avoid re-firing on prop changes
  useEffect(() => {
    void postEvent(sessionId, variant, "recommendation_viewed", rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggleFix(): void {
    if (!showFix) {
      void postEvent(sessionId, variant, "recommendation_clicked", rec);
    }
    setShowFix((prev) => !prev);
  }

  function handleApply(): void {
    void postEvent(sessionId, variant, "fix_applied", rec);
    setApplied(true);
    onApply?.(rec.id);
  }

  function handleDismiss(): void {
    void postEvent(sessionId, variant, "fix_dismissed", rec);
    setDismissed(true);
    onDismiss?.(rec.id);
  }

  if (dismissed) return <></>;

  return (
    <div
      className={`bg-slate-800 border ${applied ? "border-brand-500/50" : "border-slate-700"} rounded-xl p-5 shadow-md transition-all duration-300 animate-fade-in`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sev.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
          {sev.label}
        </span>
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cat}`}>
          {rec.category}
        </span>
        <span className="ml-auto text-xs text-slate-500 font-mono">{rec.collectionName}</span>
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-sm mb-2 ${applied ? "text-brand-500 line-through opacity-60" : "text-white"}`}>
        {applied && <span className="mr-2">✓</span>}
        {rec.title}
      </h3>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{rec.description}</p>

      {/* Fix panel */}
      {showFix && (
        <div className="mb-4 animate-slide-down">
          <p className="text-slate-300 text-sm mb-3">{rec.fixSuggestion}</p>
          <div className="relative bg-slate-950 border border-slate-700 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={copy}
              aria-label="Copy code example"
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="p-4 pr-16 text-brand-500 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {rec.codeExample}
            </pre>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          id={`toggleFix-${rec.id}`}
          onClick={handleToggleFix}
          className="text-xs font-medium text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-all"
        >
          {showFix ? "Hide fix ↑" : "Show fix ↓"}
        </button>

        {!applied && (
          <button
            id={`applyFix-${rec.id}`}
            onClick={handleApply}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 border border-brand-500/40 hover:border-brand-500 bg-brand-500/5 hover:bg-brand-500/10 rounded-lg px-3 py-1.5 transition-all"
          >
            ✓ Mark as applied
          </button>
        )}

        <button
          id={`dismissRec-${rec.id}`}
          onClick={handleDismiss}
          className="text-xs font-medium text-slate-500 hover:text-slate-400 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-all"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
