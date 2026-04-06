import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeMetrics } from "../src/services/metrics.js";
import type { Db } from "mongodb";

function buildMockDb(aggregateResults: Array<Record<string, unknown>>): Db {
  return {
    collection: vi.fn().mockReturnValue({
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(aggregateResults),
      }),
    }),
  } as unknown as Db;
}

describe("computeMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates clickThroughRate correctly for each variant", async () => {
    const db = buildMockDb([
      {
        _id: "A",
        sessions: ["s1", "s2"],
        totalViews: 100,
        totalClicks: 40,
        totalApplied: 20,
      },
      {
        _id: "B",
        sessions: ["s3"],
        totalViews: 80,
        totalClicks: 24,
        totalApplied: 8,
      },
    ]);

    const [variantA, variantB] = await computeMetrics(db);

    expect(variantA?.variant).toBe("A");
    expect(variantA?.clickThroughRate).toBeCloseTo(0.4);
    expect(variantA?.applyRate).toBeCloseTo(0.2);

    expect(variantB?.variant).toBe("B");
    expect(variantB?.clickThroughRate).toBeCloseTo(0.3);
    expect(variantB?.applyRate).toBeCloseTo(0.1);
  });

  it("returns zero rates for both variants when no events exist", async () => {
    const db = buildMockDb([]); // empty aggregation result

    const metrics = await computeMetrics(db);

    expect(metrics).toHaveLength(2);
    for (const m of metrics) {
      expect(m.totalSessions).toBe(0);
      expect(m.totalViews).toBe(0);
      expect(m.clickThroughRate).toBe(0);
      expect(m.applyRate).toBe(0);
    }
  });

  it("correctly separates variant A and variant B metrics", async () => {
    const db = buildMockDb([
      {
        _id: "B",
        sessions: ["s1"],
        totalViews: 50,
        totalClicks: 10,
        totalApplied: 5,
      },
      {
        _id: "A",
        sessions: ["s2", "s3", "s4"],
        totalViews: 200,
        totalClicks: 80,
        totalApplied: 60,
      },
    ]);

    const metrics = await computeMetrics(db);

    // Output must always be ordered [A, B]
    expect(metrics[0]?.variant).toBe("A");
    expect(metrics[1]?.variant).toBe("B");

    expect(metrics[0]?.totalSessions).toBe(3);
    expect(metrics[1]?.totalSessions).toBe(1);
    expect(metrics[0]?.totalClicks).toBe(80);
    expect(metrics[1]?.totalClicks).toBe(10);
  });
});
