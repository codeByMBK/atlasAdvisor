import { Router, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { randomUUID } from "crypto";
import { getDb, getMetricsDb } from "../utils/mongo.js";
import { analyseDatabase } from "../services/analyser.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const isJson =
      file.mimetype === "application/json" ||
      file.mimetype === "text/plain" ||
      file.originalname.endsWith(".json");
    if (isJson) {
      cb(null, true);
    } else {
      cb(new Error("Only .json files are accepted"));
    }
  },
});

const CollectionNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_]+$/)
  .default("uploaded_data");

// POST /api/analyse/upload — analyse an uploaded JSON array of documents
router.post("/", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  let rawDocs: unknown;
  try {
    rawDocs = JSON.parse(req.file.buffer.toString("utf-8"));
  } catch {
    res.status(400).json({ error: "File contains invalid JSON" });
    return;
  }

  if (!Array.isArray(rawDocs)) {
    res.status(400).json({ error: "File must be a JSON array of documents" });
    return;
  }

  if (rawDocs.length === 0) {
    res.status(400).json({ error: "File contains no documents" });
    return;
  }

  if (rawDocs.length > 1000) {
    res.status(400).json({ error: "Too many documents — maximum is 1,000" });
    return;
  }

  const nameParsed = CollectionNameSchema.safeParse(
    req.body["collectionName"] ?? "uploaded_data"
  );
  const collectionName = nameParsed.success ? nameParsed.data : "uploaded_data";

  // Unique temp database per upload so parallel requests never interfere
  const uploadUri = process.env["METRICS_DB_URI"] ?? "mongodb://localhost:27017";
  const tempDbName = `atlasadvisor_upload_${randomUUID()}`;

  let client;
  try {
    const { db, client: mongoClient } = await getDb(uploadUri, tempDbName);
    client = mongoClient;

    await db.collection(collectionName).insertMany(rawDocs as Record<string, unknown>[]);
    const result = await analyseDatabase(db);

    // Increment global counter — best-effort
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
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      error: "Failed to analyse uploaded file",
      details: message,
    });
  } finally {
    if (client) {
      try {
        await client.db(tempDbName).dropDatabase();
      } catch (e) { console.error("[mongo] Failed to drop temp db:", e); }
      await client.close();
    }
  }
});

export default router;
