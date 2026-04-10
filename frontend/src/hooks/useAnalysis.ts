import { useState, useCallback } from "react";
import type { AnalysisResult } from "../types/index.js";

interface UseAnalysisReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyse: (connectionString: string, databaseName: string) => Promise<void>;
  analyseSample: (databaseName: string) => Promise<void>;
  analyseFile: (file: File, collectionName: string) => Promise<void>;
}

async function parseResponse(response: Response): Promise<{ data: AnalysisResult | null; error: string | null }> {
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    if (response.status === 429) {
      return { data: null, error: "Too many requests — please wait a moment before trying again." };
    }
    const errMsg =
      typeof data["error"] === "string"
        ? data["error"]
        : `Server error: ${response.status}`;
    return { data: null, error: errMsg };
  }
  return { data: data as unknown as AnalysisResult, error: null };
}

function makeAbortableRequest(timeoutMs = 60_000): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function begin() {
    setLoading(true);
    setError(null);
    setResult(null);
  }

  function finish(data: AnalysisResult | null, err: string | null) {
    setResult(data);
    setError(err);
    setLoading(false);
  }

  const analyse = useCallback(
    async (connectionString: string, databaseName: string): Promise<void> => {
      begin();
      const { signal, clear } = makeAbortableRequest();
      try {
        const response = await fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionString, databaseName }),
          signal,
        });
        clear();
        const { data, error: err } = await parseResponse(response);
        finish(data, err);
      } catch (err) {
        clear();
        const isTimeout = err instanceof Error && err.name === "AbortError";
        const message = isTimeout
          ? "Analysis timed out — the database may be too large or unreachable."
          : err instanceof Error ? err.message : "Network error — is the backend running?";
        finish(null, message);
      }
    },
    []
  );

  const analyseSample = useCallback(
    async (databaseName: string): Promise<void> => {
      begin();
      const { signal, clear } = makeAbortableRequest();
      try {
        const response = await fetch("/api/analyse/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ databaseName }),
          signal,
        });
        clear();
        const { data, error: err } = await parseResponse(response);
        finish(data, err);
      } catch (err) {
        clear();
        const isTimeout = err instanceof Error && err.name === "AbortError";
        const message = isTimeout
          ? "Analysis timed out — the sample database may be unavailable."
          : err instanceof Error ? err.message : "Network error — is the backend running?";
        finish(null, message);
      }
    },
    []
  );

  const analyseFile = useCallback(
    async (file: File, collectionName: string): Promise<void> => {
      begin();
      const { signal, clear } = makeAbortableRequest();
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("collectionName", collectionName || "uploaded_data");
        const response = await fetch("/api/analyse/upload", {
          method: "POST",
          body: formData,
          signal,
        });
        clear();
        const { data, error: err } = await parseResponse(response);
        finish(data, err);
      } catch (err) {
        clear();
        const isTimeout = err instanceof Error && err.name === "AbortError";
        const message = isTimeout
          ? "Upload timed out — the file may be too large to process."
          : err instanceof Error ? err.message : "Network error — is the backend running?";
        finish(null, message);
      }
    },
    []
  );

  return { result, loading, error, analyse, analyseSample, analyseFile };
}
