import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;

/**
 * Returns a connected Db instance for the given URI and database name.
 * Reuses the module-level cached client to avoid redundant connections.
 */
export async function getDb(uri: string, dbName: string): Promise<{ db: Db; client: MongoClient }> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 5_000,
  });
  await client.connect();
  const db = client.db(dbName);
  return { db, client };
}

/**
 * Returns a persistent metrics DB connection (module-level singleton).
 * This connection stays open for the lifetime of the process.
 */
export async function getMetricsDb(): Promise<Db> {
  const metricsUri = process.env["METRICS_DB_URI"] ?? "mongodb://localhost:27017";
  const metricsDbName = process.env["METRICS_DB_NAME"] ?? "atlasadvisor_metrics";

  if (!cachedClient) {
    cachedClient = new MongoClient(metricsUri);
    try {
      await cachedClient.connect();
      console.info(`[mongo] Connected to metrics DB: ${metricsDbName}`);
    } catch (err) {
      cachedClient = null;
      console.error("[mongo] Failed to connect to metrics DB:", err);
      throw new Error("Could not connect to metrics database. Is MongoDB running?");
    }
  }

  return cachedClient.db(metricsDbName);
}
