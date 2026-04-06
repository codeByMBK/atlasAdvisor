# AtlasAdvisor

AtlasAdvisor is a MongoDB performance recommendation engine that connects to any MongoDB database, analyses its collections, and surfaces targeted, actionable recommendations across three domains: index coverage, schema consistency, and query efficiency. Each recommendation includes a severity level (HIGH / MEDIUM / LOW), a plain-English description of the problem, a concrete fix suggestion, and a ready-to-run code snippet, making it a practical tool for engineering teams doing MongoDB performance reviews.

## Prerequisites

- Node.js 18+ : both backend and frontend use modern ESM APIs
- MongoDB running locally on `mongodb://localhost:27017` by default (or any reachable URI)
- npm 9+ used

## Installation
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

## Running Locally

```bash
# Terminal 1: Backend API (Express on port 3001)
cd backend
npm run dev

# Terminal 2: Frontend (Vite dev server on port 5173)
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.
Avoiding CORS issues: Vite proxy forwards all `/api/*` requests to `http://localhost:3001`

---

## Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

| Variable        | Default                      | Purpose                              |
|-----------------|------------------------------|--------------------------------------|
| `PORT`          | `3001`                       | Express server port                  |
| `MONGODB_URI`   | `mongodb://localhost:27017`  | Base URI (used for health checks)    |
| `METRICS_DB_URI`| `mongodb://localhost:27017`  | MongoDB instance for A/B event store |
| `METRICS_DB_NAME`| `atlasadvisor_metrics`      | Database for A/B test events         |

---

## Running Tests

```bash
cd backend
npm test
```

This runs 8 unit tests using **vitest** with fully mocked MongoDB driver; no live database required.

```
✓ analyser > returns empty recommendations for an empty collection
✓ analyser > flags missing secondary index (HIGH)
✓ analyser > flags inconsistent field presence (MEDIUM)
✓ analyser > flags unbounded array (HIGH)
✓ analyser > does not throw when database has no collections
✓ metrics > calculates clickThroughRate correctly
✓ metrics > returns zero rates when no events exist
✓ metrics > correctly separates variant A and B metrics
```

---

## How It Works

### Analysis Engine

When you submit a MongoDB connection string and database name, the backend opens a transient connection, lists all collections, and runs three independent analysis passes on each. The **index pass** checks for collections with no secondary indexes (a common source of full-collection scans) and flags collections with excessive index counts that amplify write latency. The **schema pass** samples up to 50 documents per collection and detects fields that appear inconsistently (indicating schema drift) and array fields that have grown to over 100 elements (a 16 MB document-size risk). The **query pass** uses `estimatedDocumentCount()` to identify large collections (>10k docs) with no secondary indexes. The connection is closed immediately after analysis and results are returned as a typed `AnalysisResult` JSON response.

### A/B Testing Module

On first load, each browser session is randomly assigned to **Variant A** (recommendations sorted by severity: HIGH → MEDIUM → LOW) or **Variant B** (recommendations grouped by category: Index, Schema, Query). The assignment is stored in `localStorage` so it persists for the session. As users interact — viewing, expanding, applying, or dismissing recommendations — the frontend fires events to `POST /api/events`, which are stored in a dedicated `atlasadvisor_metrics` MongoDB database. This separation ensures the metrics store is independent of any database being analysed.

### Metrics Dashboard

The **Metrics** tab fetches aggregated A/B data from `GET /api/metrics` and displays a comparison table (sessions, views, clicks, CTR, apply rate) alongside a grouped bar chart (built with **recharts**). The dashboard auto-refreshes every 30 seconds so you can watch engagement data accumulate during a live demo. Both variants are always shown — even with zero data — to prevent chart rendering issues.

---

## Design Decisions

### 1. Native `mongodb` Driver over Mongoose

Mongoose's schema validation layer adds value for application databases but is counterproductive here: AtlasAdvisor intentionally works with *any* database structure, including ones without schemas. The native driver gives direct access to `db.listCollections()`, `collection.indexes()`, and aggregation pipelines without Mongoose's abstraction overhead. It also makes the codebase smaller and the MongoDB API surface more explicit — which is useful to demonstrate in a MongoDB engineering context.

### 2. Zod for Request Validation

Zod provides parse-time type safety that TypeScript's type system alone cannot enforce at runtime API boundaries. Validating the `connectionString` with a `startsWith("mongodb")` refinement prevents trivially invalid URIs from reaching the MongoDB driver. The `AbTestEvent` schema uses `z.coerce.date()` to accept ISO strings from the frontend and coerce them to `Date` instances before database insertion — eliminating a whole class of type mismatch bugs at zero extra code.

### 3. Separate Analysis and Metrics Connections

The analysis connection is opened per-request and closed in a `finally` block — guaranteeing cleanup even if analysis throws. The metrics connection is a module-level singleton that stays open for the server's lifetime, avoiding connection overhead on every event write. This two-tier pattern reflects a real production distinction between query workloads (short-lived, ad hoc) and write workloads (high-frequency, persistent).

---

## Project Structure

```
atlasadvisor/
├── backend/
│   ├── src/
│   │   ├── index.ts              Express server entry point
│   │   ├── routes/
│   │   │   ├── analyse.ts        POST /api/analyse
│   │   │   └── events.ts         POST /api/events, GET /api/metrics
│   │   ├── services/
│   │   │   ├── analyser.ts       Core recommendation logic
│   │   │   └── metrics.ts        Event aggregation logic
│   │   ├── types/index.ts        Shared TypeScript interfaces
│   │   └── utils/mongo.ts        MongoDB connection helpers
│   ├── tests/
│   │   ├── analyser.test.ts      5 unit tests
│   │   └── metrics.test.ts       3 unit tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── App.tsx               Root layout + tab navigation
    │   ├── components/
    │   │   ├── ConnectionForm.tsx
    │   │   ├── RecommendationCard.tsx
    │   │   ├── RecommendationList.tsx
    │   │   └── MetricsDashboard.tsx
    │   ├── hooks/
    │   │   ├── useVariant.ts     A/B assignment + session ID
    │   │   └── useAnalysis.ts    Analysis request lifecycle
    │   └── types/index.ts
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

## RESULTS

