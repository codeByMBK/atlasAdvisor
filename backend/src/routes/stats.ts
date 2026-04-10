import { Router, Request, Response } from "express";
import { getMetricsDb } from "../utils/mongo.js";

const router = Router();

// GET /api/stats — global usage counter
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getMetricsDb();
    const doc = await db.collection<{ _id: string; totalAnalyses: number; lastUpdated: Date | null }>("global_stats").findOne({ _id: "stats" });
    res.json({
      totalAnalyses: (doc?.["totalAnalyses"] as number) ?? 0,
      lastUpdated: doc?.["lastUpdated"] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    res.status(500).json({ error: message });
  }
});

export default router;
