import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDb, getMetricsDb } from "../utils/mongo.js";
import { analyseDatabase } from "../services/analyser.js";

const router = Router();

const AnalyseBodySchema = z.object({
  connectionString: z
    .string()
    .min(1, "connectionString is required")
    .refine((s) => s.startsWith("mongodb"), {
      message: 'connectionString must start with "mongodb"',
    }),
  databaseName: z.string().min(1, "databaseName is required"),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = AnalyseBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { connectionString, databaseName } = parsed.data;
  let client;

  try {
    const { db, client: mongoClient } = await getDb(connectionString, databaseName);
    client = mongoClient;
    const result = await analyseDatabase(db);

    // Increment global counter — best-effort, never fails the response
    try {
      const metricsDb = await getMetricsDb();
      await metricsDb.collection<{ _id: string; totalAnalyses: number; lastUpdated: Date | null }>("global_stats").updateOne(
        { _id: "stats" },
        { $inc: { totalAnalyses: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
      );
    } catch (e) { console.error("[metrics] Failed to increment counter:", e); }

    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown connection error";

    // Provide more specific error messages based on the type of error
    if (message.includes("authentication failed") || message.includes("Unauthorized")) {
      res.status(401).json({
        error: "Authentication failed",
        details: "Invalid connection string credentials. Check username and password.",
      });
    } else if (
      message.includes("connect ECONNREFUSED") ||
      message.includes("getaddrinfo ENOTFOUND")
    ) {
      res.status(503).json({
        error: "Cannot reach MongoDB server",
        details: "The MongoDB server is unreachable. Verify the server is running and accessible.",
      });
    } else {
      res.status(500).json({
        error: "Failed to connect to MongoDB or run analysis",
        details: message,
      });
    }
  } finally {
    // Always closing the per-request analysis connection
    if (client) {
      await client.close();
    }
  }
});

export default router;
