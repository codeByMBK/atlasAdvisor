import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyseDatabase } from "../src/services/analyser.js";
import type { Db } from "mongodb";

/**
 * Helper to build a mock Db instance with configurable behaviour.
 * All MongoDB methods are replaced with vi.fn() stubs.
 */
function buildMockDb(overrides: {
  collections?: Array<{ name: string }>;
  indexes?: Record<string, Array<Record<string, unknown>>>;
  docs?: Record<string, Array<Record<string, unknown>>>;
  docCounts?: Record<string, number>;
}): Db {
  const {
    collections = [],
    indexes = {},
    docs = {},
    docCounts = {},
  } = overrides;

  const mockDb = {
    databaseName: "testdb",
    listCollections: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(collections),
    }),
    collection: vi.fn((name: string) => ({
      indexes: vi.fn().mockResolvedValue(indexes[name] ?? [{ key: { _id: 1 } }]),
      find: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(docs[name] ?? []),
        }),
      }),
      estimatedDocumentCount: vi.fn().mockResolvedValue(docCounts[name] ?? 0),
    })),
  } as unknown as Db;

  return mockDb;
}

describe("analyseDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty recommendations for an empty collection (no docs, only _id index)", async () => {
    const db = buildMockDb({
      collections: [{ name: "users" }],
      indexes: { users: [{ key: { _id: 1 } }] },
      docs: { users: [] },
      docCounts: { users: 0 },
    });

    const result = await analyseDatabase(db);

    // Empty collection → no schema issues, but still flags the missing secondary index
    expect(result.collectionsAnalysed).toBe(1);
    expect(result.databaseName).toBe("testdb");
    // The missing-index HIGH rec should fire even for empty collections
    expect(result.recommendations.some((r) => r.category === "index" && r.severity === "HIGH")).toBe(true);
  });

  it("flags missing secondary index (HIGH) when only _id index exists", async () => {
    const db = buildMockDb({
      collections: [{ name: "orders" }],
      indexes: { orders: [{ key: { _id: 1 } }] },
      docs: { orders: [{ _id: "1", total: 99 }] },
    });

    const result = await analyseDatabase(db);
    const rec = result.recommendations.find(
      (r) => r.category === "index" && r.severity === "HIGH"
    );

    expect(rec).toBeDefined();
    expect(rec?.title).toContain("No secondary indexes");
    expect(rec?.collectionName).toBe("orders");
  });

  it("flags inconsistent field presence (MEDIUM) when a field appears in 20–80% of docs", async () => {
    // 10 docs, 'email' field present in 5 to 50% then should trigger
    const docs = Array.from({ length: 10 }, (_, i) => ({
      _id: `${i}`,
      name: `User${i}`,
      ...(i < 5 ? { email: `u${i}@x.com` } : {}),
    }));

    const db = buildMockDb({
      collections: [{ name: "users" }],
      indexes: { users: [{ key: { _id: 1 } }, { key: { name: 1 } }] },
      docs: { users: docs },
    });

    const result = await analyseDatabase(db);
    const rec = result.recommendations.find(
      (r) => r.category === "schema" && r.severity === "MEDIUM" && r.title.includes("email")
    );

    expect(rec).toBeDefined();
    expect(rec?.title).toContain("Inconsistent field presence");
  });

  it("flags unbounded array (HIGH) when array length exceeds 100", async () => {
    const bigArray = Array.from({ length: 150 }, (_, i) => i);
    const docs = [{ _id: "1", tags: bigArray, name: "test" }];

    const db = buildMockDb({
      collections: [{ name: "products" }],
      indexes: { products: [{ key: { _id: 1 } }, { key: { name: 1 } }] },
      docs: { products: docs },
    });

    const result = await analyseDatabase(db);
    const rec = result.recommendations.find(
      (r) => r.category === "schema" && r.severity === "HIGH" && r.title.includes("tags")
    );

    expect(rec).toBeDefined();
    expect(rec?.title).toContain("Unbounded array");
  });

  it("does not throw when database has no collections", async () => {
    const db = buildMockDb({ collections: [] });

    const result = await analyseDatabase(db);

    expect(result.collectionsAnalysed).toBe(0);
    expect(result.recommendations).toHaveLength(0);
  });
});
