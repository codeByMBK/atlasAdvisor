import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../utils/mongo.js";
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
    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown connection error";
    res.status(500).json({
      error: "Failed to connect to MongoDB or run analysis",
      details: message,
    });
  } finally {
    // Always closing the per-request analysis connection
    if (client) {
      await client.close();
    }
  }
});

export default router;
