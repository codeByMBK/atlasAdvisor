# AtlasAdvisor

**MongoDB Performance Recommender** — connect any MongoDB database and get prioritised, copy-ready recommendations for indexes, schema design, and query patterns in seconds.

🔗 **Live demo:** [atlasadvisor.vercel.app](https://atlasadvisor.vercel.app)

---

## Why it matters

A missing index on a large collection forces a **full collection scan (COLLSCAN)**. On a collection with 1 million documents:

| | Without index | With AtlasAdvisor fix |
|---|---|---|
| Query time | ~850 ms | ~2 ms |
| Server CPU | spikes on every query | negligible |
| Scalability | degrades linearly with growth | stays constant |

AtlasAdvisor runs **10+ checks** across indexes, schema, and query patterns and ranks issues by severity so you know exactly what to fix first.

```js
// ❌ BEFORE — full collection scan, 850 ms on 1M documents
db.orders.find({ userId: "abc123" })

// ✅ AFTER — index scan, ~2 ms
db.orders.createIndex({ userId: 1 })
db.orders.find({ userId: "abc123" })
```

---

## Features

- **Three analysis modes**
  - Connect your own MongoDB URI (local or Atlas)
  - Upload a JSON array of documents for offline analysis
  - Analyse one of MongoDB's official sample datasets instantly
- **10+ performance checks** covering:
  - Missing and redundant indexes
  - Unbounded arrays and schema anti-patterns
  - Inefficient query patterns (in-memory sort, regex leading wildcard, etc.)
- **Severity ranking** — HIGH / MEDIUM / LOW with potential impact badge per recommendation
- **Copy-ready fixes** — every recommendation includes a ready-to-run code snippet
- **Dark / light mode** with system preference detection and persistent toggle
- **Responsive** — works on mobile, tablet, and desktop

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas |
| Deployment | Vercel (serverless functions + static frontend) |
| Validation | Zod |

---

## Project structure

```
atlasAdvisor/
├── api/
│   └── server.ts              # Vercel serverless function entry point
├── backend/
│   └── src/
│       ├── app.ts             # Express app (middleware, routes, rate limiting)
│       ├── index.ts           # Local dev server entry
│       ├── routes/            # analyse, sample, upload, stats, events
│       ├── services/          # analyser, metrics
│       ├── types/             # Shared TypeScript types
│       └── utils/             # MongoDB connection helpers
├── frontend/
│   └── src/
│       ├── pages/             # LandingPage, AnalysePage, MetricsPage
│       ├── sections/          # HeroSection, FeaturesSection, HowItWorksSection, StatsSection
│       ├── components/        # AppShell, SharedHeader, ConnectionForm, RecommendationCard, …
│       ├── hooks/             # useAnalysis, useVariant
│       └── types/
├── vercel.json                # Build config + API rewrites
└── package.json               # Root-level backend dependencies (for Vercel bundling)
```

---

## Running locally

**Prerequisites:** Node.js 18+, a running MongoDB instance

```bash
# Clone
git clone https://github.com/codeByMBK/atlasAdvisor.git
cd atlasAdvisor

# Backend
cd backend
npm install
cp .env.example .env          # Fill in MONGODB_URI, METRICS_DB_URI, etc.
npm run dev                    # Starts on http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                    # Starts on http://localhost:5173
```

---

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | Default MongoDB connection (fallback) | `mongodb://localhost:27017` |
| `METRICS_DB_URI` | Atlas URI for the metrics / stats database | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `METRICS_DB_NAME` | Database name for metrics | `atlasadvisor_metrics` |
| `SAMPLE_MONGODB_URI` | Atlas URI with sample datasets loaded | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `ALLOWED_ORIGIN` | CORS allowed origin (defaults to `*`) | `https://yourdomain.com` |
| `PORT` | Local dev port | `3001` |

---

## Deploying to Vercel

1. Fork / clone this repo
2. Create a MongoDB Atlas cluster and load sample datasets (optional)
3. In Atlas **Network Access**, add `0.0.0.0/0` to allow Vercel's dynamic IPs
4. Import the project on [vercel.com](https://vercel.com) and set the environment variables above
5. Vercel auto-detects the build config from `vercel.json` — no extra setup needed

---

## Performance checks

| Check | Category | What it detects |
|---|---|---|
| No secondary indexes | Index | Collections with only `_id` index |
| Redundant indexes | Index | Indexes that are prefixes of other indexes |
| Missing index on filtered field | Index | Fields used in queries without an index |
| Unbounded array fields | Schema | Arrays that grow without a size cap |
| Mixed field types | Schema | Fields storing more than one BSON type |
| Sparse field presence | Schema | Fields missing from the majority of documents |
| In-memory sort | Query | Sort fields not covered by any index |
| Leading wildcard regex | Query | Patterns that bypass index usage |
| Oversized documents | Schema | Average document exceeds 16 KB |
| Low-selectivity index | Index | Indexes on boolean or very-low-cardinality fields |
