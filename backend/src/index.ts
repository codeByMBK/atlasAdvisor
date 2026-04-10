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
const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

app.use(helmet());
app.use(cors({ origin: process.env["ALLOWED_ORIGIN"] ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

// Rate limiter for analysis endpoints — 10 requests per minute per IP
const analyseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests — please wait a moment before trying again." },
});

// Looser rate limiter for read endpoints — 60 requests per minute per IP
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});

// Rate limiter for event tracking — 120 events per minute per IP
const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many event requests." },
});

// Health check — also verifies metrics DB connectivity
app.get("/health", async (_req, res) => {
  try {
    const db = await getMetricsDb();
    await db.command({ ping: 1 });
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", timestamp: new Date().toISOString() });
  }
});

// Analysis routes — specific sub-routes before the catch-all
app.use("/api/analyse/sample", analyseLimiter, sampleRouter);
app.use("/api/analyse/upload", analyseLimiter, uploadRouter);
app.use("/api/analyse", analyseLimiter, analyseRouter);

// A/B test events
app.use("/api/events", eventsLimiter, eventsRouter);

// GET /api/metrics
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

// DELETE /api/metrics — clear all A/B test event data
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

// GET /api/stats — global usage counter
app.use("/api/stats", statsRouter);

app.listen(PORT, () => {
  console.info(`[server] AtlasAdvisor API running on http://localhost:${PORT}`);

  // Ensure indexes on A/B events collection
  getMetricsDb()
    .then(async (db) => {
      const col = db.collection("ab_test_events");
      // TTL — expire documents after 30 days
      await col.createIndex({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30, background: true });
      // Compound index to speed up variant aggregation queries
      await col.createIndex({ variant: 1, timestamp: -1 }, { background: true });
    })
    .catch((err) => console.error("[mongo] Failed to create indexes:", err));
});

export default app;
