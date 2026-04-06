import { Db } from "mongodb";
import type { VariantMetrics } from "../types/index.js";

/**
 * Aggregates ab_test_events by variant and computes engagement rates.
 * Returns zero-value metrics for variants with no events.
 */
export async function computeMetrics(db: Db): Promise<VariantMetrics[]> {
  const collection = db.collection("ab_test_events");

  const pipeline = [
    {
      $group: {
        _id: "$variant",
        sessions: { $addToSet: "$sessionId" },
        totalViews: {
          $sum: { $cond: [{ $eq: ["$event", "recommendation_viewed"] }, 1, 0] },
        },
        totalClicks: {
          $sum: { $cond: [{ $eq: ["$event", "recommendation_clicked"] }, 1, 0] },
        },
        totalApplied: {
          $sum: { $cond: [{ $eq: ["$event", "fix_applied"] }, 1, 0] },
        },
      },
    },
  ];

  const results = await collection.aggregate(pipeline).toArray();

  // Build a map from aggregation results for easy lookup
  const metricsMap = new Map<"A" | "B", VariantMetrics>();

  for (const doc of results) {
    const variant = doc["_id"] as "A" | "B";
    const totalViews = doc["totalViews"] as number;
    const totalClicks = doc["totalClicks"] as number;
    const totalApplied = doc["totalApplied"] as number;
    const totalSessions = (doc["sessions"] as string[]).length;

    metricsMap.set(variant, {
      variant,
      totalSessions,
      totalViews,
      totalClicks,
      totalApplied,
      // Guard against division by zero
      clickThroughRate: totalViews > 0 ? totalClicks / totalViews : 0,
      applyRate: totalViews > 0 ? totalApplied / totalViews : 0,
    });
  }

  // Always return both variants, even with zeros, so the chart renders consistently
  const defaultMetrics = (variant: "A" | "B"): VariantMetrics => ({
    variant,
    totalSessions: 0,
    totalViews: 0,
    totalClicks: 0,
    totalApplied: 0,
    clickThroughRate: 0,
    applyRate: 0,
  });

  return [
    metricsMap.get("A") ?? defaultMetrics("A"),
    metricsMap.get("B") ?? defaultMetrics("B"),
  ];
}
