import { Db } from "mongodb";
import { randomUUID } from "crypto";
import type { AnalysisResult, Recommendation } from "../types/index.js";

/**
 * Full analysis on a connected MongoDB database.
 * Handlesempty databases and collections.
 */
export async function analyseDatabase(db: Db): Promise<AnalysisResult> {
  const recommendations: Recommendation[] = [];

  const collectionInfos = await db.listCollections().toArray();

  if (collectionInfos.length === 0) {
    return {
      databaseName: db.databaseName,
      collectionsAnalysed: 0,
      recommendations: [],
      analysedAt: new Date(),
    };
  }

  for (const info of collectionInfos) {
    const name = info.name;
    const collection = db.collection(name);

    // INDEX ANALYSIS
    const indexes = await collection.indexes();

    // Only the default _id index present. no secondary indexes
    if (indexes.length <= 1) {
      recommendations.push(buildRec({
        category: "index",
        severity: "HIGH",
        collectionName: name,
        title: `No secondary indexes found on \`${name}\``,
        description:
          `The \`${name}\` collection has no secondary indexes. ` +
          "All queries beyond _id lookups will perform full collection scans, which will become increasingly slow as data grows.",
        fixSuggestion:
          "Add a secondary index on the field(s) most commonly used in query filters or sort operations.",
        codeExample:
          `db.collection("${name}").createIndex({ yourField: 1 });`,
      }));
    }

    // if too many indexes, then write amplification risk
    if (indexes.length > 5) {
      recommendations.push(buildRec({
        category: "index",
        severity: "MEDIUM",
        collectionName: name,
        title: `High index count may slow writes on \`${name}\``,
        description:
          `\`${name}\` has ${indexes.length} indexes. Each write operation must update every index, ` +
          "increasing write latency and storage overhead. Review whether all indexes are actively used.",
        fixSuggestion:
          "Use db.collection.aggregate([{ $indexStats: {} }]) to identify unused indexes and drop them.",
        codeExample:
          `db.collection("${name}").aggregate([{ $indexStats: {} }]);`,
      }));
    }

    // SCHEMA ANALYSIS
    const sampleDocs = await collection.find({}).limit(50).toArray();

    if (sampleDocs.length > 0) {
      // Track field presence frequency across sampled documents
      const fieldCounts: Record<string, number> = {};
      const arrayLengths: Record<string, number[]> = {};

      for (const doc of sampleDocs) {
        for (const [key, value] of Object.entries(doc)) {
          if (key === "_id") continue;
          fieldCounts[key] = (fieldCounts[key] ?? 0) + 1;

          if (Array.isArray(value)) {
            if (!arrayLengths[key]) arrayLengths[key] = [];
            arrayLengths[key].push(value.length);
          }
        }
      }

      const total = sampleDocs.length;

      // Inconsistent field presence(appears in 20–80% of docs)
      for (const [field, count] of Object.entries(fieldCounts)) {
        const ratio = count / total;
        if (ratio > 0.2 && ratio < 0.8) {
          recommendations.push(buildRec({
            category: "schema",
            severity: "MEDIUM",
            collectionName: name,
            title: `Inconsistent field presence: \`${field}\` in \`${name}\``,
            description:
              `The field \`${field}\` is present in only ${Math.round(ratio * 100)}% of sampled documents in \`${name}\`. ` +
              "Inconsistent fields complicate query logic, require null-checks everywhere, and indicate potential schema drift.",
            fixSuggestion:
              "Define a canonical schema and use a migration script to backfill missing fields with a default value.",
            codeExample:
              `db.collection("${name}").updateMany(\n  { ${field}: { $exists: false } },\n  { $set: { ${field}: null } }\n);`,
          }));
        }
      }

      // Unbounded array(any sampled doc has an array with length > 100)
      for (const [field, lengths] of Object.entries(arrayLengths)) {
        const maxLen = Math.max(...lengths);
        if (maxLen > 100) {
          recommendations.push(buildRec({
            category: "schema",
            severity: "HIGH",
            collectionName: name,
            title: `Unbounded array detected: \`${field}\` may degrade query performance`,
            description:
              `The array field \`${field}\` in \`${name}\` contains up to ${maxLen} elements in a single document. ` +
              "MongoDB documents are limited to 16 MB, and large arrays cause significant memory pressure during reads and aggregations.",
            fixSuggestion:
              "Consider extracting the array into a separate collection with a reference, or implement a fixed-size sliding window.",
            codeExample:
              `// Separate collection pattern\ndb.createCollection("${name}_${field}");\n// Each element becomes its own document:\n// { parentId: <_id>, value: <element>, createdAt: Date }`,
          }));
        }
      }
    }

    // QUERY ANALYSIS
    const docCount = await collection.estimatedDocumentCount();
    const hasOnlyIdIndex = indexes.length <= 1;

    if (docCount > 10_000 && hasOnlyIdIndex) {
      recommendations.push(buildRec({
        category: "query",
        severity: "HIGH",
        collectionName: name,
        title: `Large collection \`${name}\` has no secondary indexes`,
        description:
          `\`${name}\` contains approximately ${docCount.toLocaleString()} documents but has no secondary indexes. ` +
          "Full collection scans on this volume will cause significant latency and increased CPU usage under load.",
        fixSuggestion:
          "Identify the most frequent query patterns using MongoDB Atlas's Query Profiler or the $currentOp aggregation, then create targeted indexes.",
        codeExample:
          `// Profile slow queries first:\ndb.setProfilingLevel(1, { slowms: 100 });\n\n// Then create a covering index on your hottest query:\ndb.collection("${name}").createIndex({ field1: 1, field2: -1 });`,
      }));
    }
  }

  return {
    databaseName: db.databaseName,
    collectionsAnalysed: collectionInfos.length,
    recommendations,
    analysedAt: new Date(),
  };
}

function buildRec(
  partial: Omit<Recommendation, "id">
): Recommendation {
  return { id: randomUUID(), ...partial };
}
