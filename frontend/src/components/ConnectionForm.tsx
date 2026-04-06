import React, { useState } from "react";

interface ConnectionFormProps {
  onResult: (connectionString: string, databaseName: string) => void;
  loading: boolean;
  error: string | null;
}

export function ConnectionForm({ onResult, loading, error }: ConnectionFormProps): React.ReactElement {
  const [connectionString, setConnectionString] = useState("mongodb://localhost:27017");
  const [databaseName, setDatabaseName] = useState("test");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!connectionString.trim() || !databaseName.trim()) return;
    onResult(connectionString.trim(), databaseName.trim());
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-slow" />
        <h2 className="text-lg font-semibold text-white">Connect to MongoDB</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="connectionString"
            className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
          >
            Connection String
          </label>
          <input
            id="connectionString"
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="mongodb://localhost:27017"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="databaseName"
            className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
          >
            Database Name
          </label>
          <input
            id="databaseName"
            type="text"
            value={databaseName}
            onChange={(e) => setDatabaseName(e.target.value)}
            placeholder="myDatabase"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg p-3 animate-fade-in">
            <svg className="w-4 h-4 mt-0.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          id="analyseButton"
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analysing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Analyse Database
            </>
          )}
        </button>
      </form>
    </div>
  );
}
