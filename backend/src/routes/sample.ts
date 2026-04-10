import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDb, getMetricsDb } from "../utils/mongo.js";
import { analyseDatabase } from "../services/analyser.js";

const router = Router();

const ALLOWED_DATASETS = [
  "sample_mflix",
  "sample_analytics",
  "sample_airbnb",
  "sample_restaurants",
  "sample_supplies",
  "sample_weatherdata",
  "sample_geospatial",
  "sample_training",
] as const;

const SampleBodySchema = z.object({
  databaseName: z.enum(ALLOWED_DATASETS),
});

// POST /api/analyse/sample — analyse a named sample dataset using SAMPLE_MONGODB_URI
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = SampleBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { databaseName } = parsed.data;
  const connectionString =
    process.env["SAMPLE_MONGODB_URI"] ?? "mongodb://localhost:27017";
  let client;

  try {
    const { db, client: mongoClient } = await getDb(connectionString, databaseName);
    client = mongoClient;
    const result = await analyseDatabase(db);

    // Increment global counter — best-effort, never fails the response
    try {
      const metricsDb = await getMetricsDb();
      await metricsDb.collection("global_stats").updateOne(
        { _id: "stats" },
        { $inc: { totalAnalyses: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
      );
    } catch (e) { console.error("[metrics] Failed to increment counter:", e); }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("authentication failed") || message.includes("Unauthorized")) {
      res.status(401).json({
        error: "Authentication failed",
        details: "Invalid credentials for the sample MongoDB connection. Check SAMPLE_MONGODB_URI.",
      });
    } else if (
      message.includes("connect ECONNREFUSED") ||
      message.includes("getaddrinfo ENOTFOUND")
    ) {
      res.status(503).json({
        error: "Cannot reach MongoDB server",
        details: "The sample MongoDB server is unreachable. Verify SAMPLE_MONGODB_URI is correct and the server is running.",
      });
    } else {
      res.status(500).json({
        error: "Failed to connect or run analysis",
        details: message,
      });
    }
  } finally {
    if (client) await client.close();
  }
});

export default router;
