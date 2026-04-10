import { Router, Request, Response } from "express";
import { z } from "zod";
import { getMetricsDb } from "../utils/mongo.js";

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

export default router;
