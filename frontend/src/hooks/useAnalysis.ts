import { useState, useCallback } from "react";
import type { AnalysisResult } from "../types/index.js";

interface UseAnalysisReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyse: (connectionString: string, databaseName: string) => Promise<void>;
}

/**
 * Manage the lifecycle of a database analysis request.
 * Separate loading, error, and result states cleanly.
 */
export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(
    async (connectionString: string, databaseName: string): Promise<void> => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionString, databaseName }),
        });

        const data = await response.json() as Record<string, unknown>;

        if (!response.ok) {
          const errMsg =
            typeof data["error"] === "string"
              ? data["error"]
              : `Server error: ${response.status}`;
          setError(errMsg);
          return;
        }

        setResult(data as unknown as AnalysisResult);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Network error — is the backend running?";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, analyse };
}
