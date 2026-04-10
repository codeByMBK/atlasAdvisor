import React, { useState, useRef } from "react";

type Mode = "own" | "sample" | "upload";

const SAMPLE_DATASETS = [
  { label: "Movies & Reviews", value: "sample_mflix" },
  { label: "Customer Transactions", value: "sample_analytics" },
  { label: "Property Listings", value: "sample_airbnb" },
  { label: "NYC Inspections", value: "sample_restaurants" },
  { label: "Sales Data", value: "sample_supplies" },
  { label: "Weather Measurements", value: "sample_weatherdata" },
  { label: "Shipwreck Data", value: "sample_geospatial" },
  { label: "Training Data", value: "sample_training" },
] as const;

interface ConnectionFormProps {
  onOwnDb: (connectionString: string, databaseName: string) => void;
  onSampleDb: (databaseName: string) => void;
  onUploadFile: (file: File, collectionName: string) => void;
  loading: boolean;
  error: string | null;
}

export function ConnectionForm({
  onOwnDb,
  onSampleDb,
  onUploadFile,
  loading,
  error,
}: ConnectionFormProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>("own");

  // Mode A state
  const [connectionString, setConnectionString] = useState("mongodb://localhost:27017");

  const [databaseName, setDatabaseName] = useState("test");

  // Mode B state
  const [selectedDataset, setSelectedDataset] = useState<string>(SAMPLE_DATASETS[0].value);

  // Mode C state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [collectionName, setCollectionName] = useState("uploaded_data");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (loading) return;

    if (mode === "own") {
      if (!connectionString.trim() || !databaseName.trim()) return;
      onOwnDb(connectionString.trim(), databaseName.trim());
    } else if (mode === "sample") {
      onSampleDb(selectedDataset);
    } else if (mode === "upload") {
      if (!uploadFile) return;
      onUploadFile(uploadFile, collectionName.trim() || "uploaded_data");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) setUploadFile(file);
  }

  const tabs: { id: Mode; label: string; icon: React.ReactElement }[] = [
    {
      id: "own",
      label: "My Own Database",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "sample",
      label: "Sample Dataset",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      id: "upload",
      label: "Upload File",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
  ];

  const submitDisabled =
    loading ||
    (mode === "upload" && !uploadFile);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-slow" />
        <h2 className="text-lg font-semibold text-white">Connect to MongoDB</h2>
      </div>

      {/* Mode toggle tabs */}
      <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
              mode === tab.id
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode A: Own Database */}
        {mode === "own" && (
          <>
            <p id="connString-help" className="text-xs text-slate-500 -mt-1">
              Works with local MongoDB or MongoDB Atlas (mongodb+srv://)
            </p>
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
                placeholder="mongodb://localhost:27017  or  mongodb+srv://user:pass@cluster.mongodb.net"
                aria-describedby="connString-help"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
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
          </>
        )}

        {/* Mode B: Sample Dataset */}
        {mode === "sample" && (
          <>
            <p className="text-xs text-slate-500 -mt-1">
              Analyse one of MongoDB Atlas&apos;s official sample databases — requires sample data loaded at <span className="font-mono">SAMPLE_MONGODB_URI</span>
            </p>
            <div>
              <label
                htmlFor="sampleDataset"
                className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Dataset
              </label>
              <select
                id="sampleDataset"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none"
              >
                {SAMPLE_DATASETS.map((ds) => (
                  <option key={ds.value} value={ds.value}>
                    {ds.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Mode C: Upload File */}
        {mode === "upload" && (
          <>
            <p className="text-xs text-slate-500 -mt-1">
              Upload a JSON array of documents to analyse
            </p>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg px-4 py-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-brand-500 bg-brand-500/10"
                  : uploadFile
                  ? "border-slate-500 bg-slate-900/50"
                  : "border-slate-600 hover:border-slate-500 bg-slate-900/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadFile(f);
                }}
              />
              {uploadFile ? (
                <div className="space-y-1">
                  <svg className="w-8 h-8 text-brand-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-white font-medium">{uploadFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {uploadFile.size >= 1024 * 1024
                      ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : `${(uploadFile.size / 1024).toFixed(1)} KB`} · Click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="w-8 h-8 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-slate-300">
                    Drag & drop a <span className="text-white font-mono">.json</span> file, or click to browse
                  </p>
                  <p className="text-xs text-slate-500">JSON array of documents · max 1,000 documents · max 10 MB</p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="collectionName"
                className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Collection name for analysis
              </label>
              <input
                id="collectionName"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="uploaded_data"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Error display */}
        {error && (
          <div role="alert" aria-live="polite" className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg p-3 animate-fade-in">
            <svg className="w-4 h-4 mt-0.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          id="analyseButton"
          type="submit"
          disabled={submitDisabled}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {mode === "own" ? "Validating & Analysing…" : "Analysing…"}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {mode === "sample" ? "Seed & Analyse" : "Analyse Database"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
