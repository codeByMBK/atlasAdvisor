import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import analyseRouter from "./routes/analyse.js";
import sampleRouter from "./routes/sample.js";
import uploadRouter from "./routes/upload.js";
import statsRouter from "./routes/stats.js";
import eventsRouter from "./routes/events.js";
import { getMetricsDb } from "./utils/mongo.js";
import { computeMetrics } from "./services/metrics.js";

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet());

// CORS: on Vercel, frontend and API share the same origin so CORS isn't
// required for browser requests. Allow explicit ALLOWED_ORIGIN env var for
// any other deployment topology. Fall back to * so the API stays accessible
// when the env var isn't set (rate limiting is the real protection here).
app.use(
  cors({
    origin: process.env["ALLOWED_ORIGIN"] ?? "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

// ── Rate limiters ───────────────────────────────────────────────────────────

const analyseLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests — please wait a moment before trying again." },
});

const readLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});

const eventsLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many event requests." },
});

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check — verifies metrics DB connectivity
app.get("/health", async (_req, res) => {
  try {
    const db = await getMetricsDb();
    await db.command({ ping: 1 });
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", timestamp: new Date().toISOString() });
  }
});

// Analysis — specific sub-paths before the catch-all
app.use("/api/analyse/sample", analyseLimiter, sampleRouter);
app.use("/api/analyse/upload", analyseLimiter, uploadRouter);
app.use("/api/analyse", analyseLimiter, analyseRouter);

// A/B test events
app.use("/api/events", eventsLimiter, eventsRouter);

// Metrics — aggregate and delete
app.get("/api/metrics", readLimiter, async (_req, res) => {
  try {
    const db = await getMetricsDb();
    const metrics = await computeMetrics(db);
    res.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute metrics";
    res.status(500).json({ error: message });
  }
});

app.delete("/api/metrics", readLimiter, async (_req, res) => {
  try {
    const db = await getMetricsDb();
    const result = await db.collection("ab_test_events").deleteMany({});
    res.json({ deleted: result.deletedCount, message: "All A/B test metrics cleared" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear metrics";
    res.status(500).json({ error: message });
  }
});

// Global stats counter
app.use("/api/stats", statsRouter);

// ── Lazy index creation ─────────────────────────────────────────────────────
// Runs once per process (module-level cache keeps it idempotent).
// Works in both long-running and serverless environments.

let _indexesReady = false;

export async function ensureMongoIndexes(): Promise<void> {
  if (_indexesReady) return;
  _indexesReady = true;
  try {
    const db = await getMetricsDb();
    const col = db.collection("ab_test_events");
    await col.createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 30, background: true }
    );
    await col.createIndex({ variant: 1, timestamp: -1 }, { background: true });
  } catch (err) {
    _indexesReady = false; // allow retry on next invocation
    console.error("[mongo] Failed to create indexes:", err);
  }
}

// Fire immediately — no-op if MongoDB is unreachable (degrades gracefully)
void ensureMongoIndexes();

export default app;
