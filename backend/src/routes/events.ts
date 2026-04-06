import { Router, Request, Response } from "express";
import { z } from "zod";
import { getMetricsDb } from "../utils/mongo.js";
import { computeMetrics } from "../services/metrics.js";

const router = Router();

const AbTestEventSchema = z.object({
  sessionId: z.string().min(1),
  variant: z.enum(["A", "B"]),
  event: z.enum([
    "recommendation_viewed",
    "recommendation_clicked",
    "fix_applied",
    "fix_dismissed",
  ]),
  recommendationId: z.string().min(1),
  recommendationCategory: z.string().min(1),
  timestamp: z.coerce.date(),
});

// POST /api/events : record a single A/B test event
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = AbTestEventSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const db = await getMetricsDb();
    await db.collection("ab_test_events").insertOne(parsed.data);
    res.status(201).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database write failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/metrics : aggregate and return variant comparison metrics
router.get("/metrics", async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getMetricsDb();
    const metrics = await computeMetrics(db);
    res.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute metrics";
    res.status(500).json({ error: message });
  }
});

export default router;
