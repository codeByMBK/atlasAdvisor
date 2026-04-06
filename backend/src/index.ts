import "dotenv/config";
import express from "express";
import cors from "cors";
import analyseRouter from "./routes/analyse.js";
import eventsRouter from "./routes/events.js";
import { getMetricsDb } from "./utils/mongo.js";
import { computeMetrics } from "./services/metrics.js";

const app = express();
const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/analyse", analyseRouter);

// POST /api/events — record A/B test events
app.use("/api/events", eventsRouter);

// GET /api/metrics — top-level route so /api/metrics is unambiguous
app.get("/api/metrics", async (_req, res) => {
  try {
    const db = await getMetricsDb();
    const metrics = await computeMetrics(db);
    res.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute metrics";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.info(`[server] AtlasAdvisor API running on http://localhost:${PORT}`);
});

export default app;
