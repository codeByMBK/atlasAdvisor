# AtlasAdvisor

**MongoDB Performance Recommender** — connect any database and get prioritised, copy-ready recommendations for indexes, schema design, and query patterns in seconds.

> **Demo tip:** Record a short screen-capture GIF (QuickTime → ezgif.com) showing the full flow — homepage → Analyse → results — and replace the placeholder below. Projects with GIFs get 3× more GitHub stars.

<!-- Replace with your actual screenshots/GIF -->
<!-- ![AtlasAdvisor demo](docs/demo.gif) -->
<!-- ![Landing page](docs/landing-dark.png) -->
<!-- ![Analysis results](docs/results.png) -->

---

## Why it matters — the impact

A missing index on a large MongoDB collection forces a **full collection scan (COLLSCAN)**. On a collection with 1 million documents, that can mean:

| | Without index | With index (AtlasAdvisor fix) |
|---|---|---|
| Query time | ~850 ms | ~2 ms |
| Server CPU | spikes on every query | negligible |
| Scalability | degrades linearly with data growth | stays constant |

AtlasAdvisor runs **10+ checks** across indexes, schema design, and query patterns and flags issues by severity so you know exactly what to fix first.

**Example recommendation AtlasAdvisor surfaces:**

```js
// ❌ BEFORE — full collection scan, 850ms on 1M documents
db.orders.find({ userId: "abc123" })
// explain → "stage": "COLLSCAN"

// ✅ AFTER — indexed lookup, 2ms
db.orders.createIndex({ userId: 1 })
// explain → "stage": "IXSCAN"
```

---

## Features

- **3 connection modes** — own connection string, built-in sample databases, or upload a JSON file
- **10+ automated checks** — missing indexes, redundant/unused indexes, unbounded arrays, mixed-type fields, $lookup overuse, full collection scans, and more
- **Severity scoring** — HIGH / MEDIUM / LOW priority so you focus where it matters most
- **Copy-ready fixes** — every recommendation includes the exact `createIndex()` or schema change to run
- **Light / dark mode** — persisted to localStorage, respected across all routes
- **A/B testing module** — two recommendation display variants (severity-sorted vs category-grouped) with a full metrics dashboard
- **Global analyses counter** — live count of databases analysed across all users
- **Read-only** — AtlasAdvisor never writes to your database

---

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or reachable via URI (for metrics storage, sample data, and optional upload flows)

> **Local MongoDB:**
> ```bash
> brew services start mongodb-community   # macOS with Homebrew
> ```

---

## Installation

```bash
# From the repo root
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Running locally

```bash
# Terminal 1 — API server (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`. All defaults work for a local MongoDB installation.

| Variable             | Default                     | Description                                          |
|----------------------|-----------------------------|------------------------------------------------------|
| `PORT`               | `3001`                      | API server port                                      |
| `METRICS_DB_URI`     | `mongodb://localhost:27017` | MongoDB URI for A/B events and global stats          |
| `METRICS_DB_NAME`    | `atlasadvisor_metrics`      | Metrics database name                                |
| `SAMPLE_MONGODB_URI` | `mongodb://localhost:27017` | Connection for the Sample Dataset mode               |
| `ALLOWED_ORIGIN`     | `http://localhost:5173`     | CORS allowed origin — set to your frontend URL in production |

**Frontend (optional):** copy `frontend/.env.example` to `frontend/.env` and set `VITE_SITE_URL` (no trailing slash) before `npm run build` to populate Open Graph / canonical URL meta tags.

---

## How analysis works

1. **Connect** — paste a MongoDB URI, choose a sample database, or upload a JSON file
2. **Analyse** — the backend lists collections, samples documents, reads index metadata, and runs 10+ checks
3. **Fix** — review prioritised recommendations with copy-ready code snippets

Each analysis opens a per-request MongoDB connection with a 5-second timeout and closes it when the run finishes. An empty database returns a clear "no collections found" message instead of a misleading "all clear".

---

## Connection modes

| Mode | How it works |
|---|---|
| **My Own Database** | Paste any `mongodb://` or `mongodb+srv://` URI + database name. Specific errors returned for auth failures, unreachable hosts, and empty databases. |
| **Sample Dataset** | Pick from eight Atlas-style sample databases. Requires sample data at `SAMPLE_MONGODB_URI`. |
| **Upload File** | Upload a `.json` file (max 1,000 docs, 10 MB). The backend seeds a UUID-isolated temp database, analyses it, then drops it. |

---

## A/B testing module

On first load the UI assigns **Variant A** (recommendations sorted by severity) or **Variant B** (grouped by category) — 50/50 — and a stable `sessionId`, both stored in `localStorage`.

Events tracked per recommendation card:
- `recommendation_viewed` — card entered viewport
- `recommendation_clicked` — fix details expanded
- `fix_applied` / `fix_dismissed` — user marked as applied or dismissed

Events are stored in `ab_test_events` with a **30-day TTL index** (auto-expiry) and a compound index on `(variant, timestamp)` for fast aggregation. The **Metrics** page shows sessions, views, clicks, CTR, and apply rate per variant with a grouped bar chart, and auto-refreshes every 30 seconds.

---

## Security

- `helmet` — standard HTTP security headers on all responses
- CORS restricted to `ALLOWED_ORIGIN`
- Rate limiting: 10 req/min (analysis), 120 req/min (events), 60 req/min (metrics reads)
- User-supplied URIs are used only for the analysis request and never stored
- Separate metrics database connection so telemetry never shares the analysed cluster's credentials

---

## Design decisions

**Native MongoDB driver over Mongoose** — The analyser only needs ad hoc reads (`listCollections`, `indexes`, sampled `find`, `estimatedDocumentCount`) and a predictable connection lifecycle. The driver keeps the stack minimal.

**Zod for request validation** — Connection strings, database names, and event payloads are validated at the API boundary with clear 400 responses.

**Separate metrics DB connection** — A long-lived singleton client points at `METRICS_DB_URI`. User-supplied connections are opened per-request and closed immediately after analysis, so they never share credentials with or affect the metrics database.

**React Router v6 with shared header** — All three routes (`/`, `/analyse`, `/metrics`) share a single `SharedHeader` component that adapts its navigation contextually: landing nav links on `/`, app tab switcher on `/analyse` and `/metrics`.

---

## Tests

```bash
cd backend && npm test
```

Eight unit tests covering the analyser and metrics aggregation, all with a mocked MongoDB driver — no live database required.

---

## Project structure

```
backend/src/
  index.ts               Server entry — helmet, cors, rate limiters, route mounting,
                         health check with metrics DB ping, index creation on startup
  routes/
    analyse.ts           POST /api/analyse
    sample.ts            POST /api/analyse/sample
    upload.ts            POST /api/analyse/upload (multer, UUID-isolated temp DB)
    events.ts            POST /api/events
    stats.ts             GET /api/stats
  services/
    analyser.ts          10+ checks — indexes, schema, query patterns
    metrics.ts           A/B event aggregation
  utils/mongo.ts         Per-request client (5s timeout) + singleton metrics client

frontend/src/
  App.tsx                React Router shell — Routes for /, /analyse, /metrics
  main.tsx               BrowserRouter + ErrorBoundary entry point
  pages/
    LandingPage.tsx      Composes all landing sections
    AnalysePage.tsx      Analyse tab with stats counter, hero banner, ConnectionForm, results
    MetricsPage.tsx      Metrics tab wrapping MetricsDashboard
  sections/              Landing page sections (rendered only on /)
    LandingHeader.tsx    (superseded by SharedHeader)
    HeroSection.tsx      Animated hero with Framer Motion parallax decoratives
    LogoTicker.tsx       Infinite-scroll MongoDB ecosystem tech badges
    FeaturesShowcase.tsx Product screenshot + feature grid with scroll animations
    HowItWorks.tsx       3-step cards: Connect → Analyse → Fix
    StatsSection.tsx     6 stat cards with staggered entrance animations
    CTASection.tsx       CTA with star/spring parallax
    LandingFooter.tsx    Black footer with rainbow glow logo
  components/
    SharedHeader.tsx     Unified sticky header — context-aware nav (landing vs app tabs),
                         light/dark toggle, mobile hamburger
    AppShell.tsx         App route wrapper — SharedHeader + theme-aware PrimaryImage backdrop
    ConnectionForm.tsx   3-mode selector with accessible error regions
    RecommendationList.tsx  Filter pills (severity + category), empty state handling
    RecommendationCard.tsx  Copy-to-clipboard, A/B event tracking
    MetricsDashboard.tsx    Skeleton loader, empty state, reset, auto-refresh
    ErrorBoundary.tsx       Render-error fallback with branded UI
  hooks/
    useAnalysis.ts       fetch with 60s AbortController timeout, 429-aware messages
    useVariant.ts        A/B assignment + sessionId via localStorage
```

---

## Screenshots

> **To add screenshots:** take them locally, commit to `docs/` in the repo, and reference them here.
>
> Recommended shots:
> - `docs/landing-dark.png` — landing page in dark mode
> - `docs/landing-light.png` — landing page in light mode (shows the toggle working)
> - `docs/results.png` — analysis results with filter pills and recommendation cards
> - `docs/metrics.png` — metrics dashboard with A/B comparison chart
> - `docs/demo.gif` — end-to-end screen recording (homepage → connect → results)

<!-- Uncomment and update paths once you have the images:

![Landing page — dark mode](docs/landing-dark.png)
![Analysis results](docs/results.png)
![Metrics dashboard](docs/metrics.png)

-->

---

## Suggesting an impact section for the live site

If you want to show real before/after numbers on the website itself, the highest-impact addition would be an **"Impact" badge on each recommendation card** — e.g.:

> ⚡ **Potential impact:** Up to 100× faster queries on large collections

This is displayable without any extra backend work since severity + category already encode how impactful a fix is. HIGH-severity index recommendations on large collections reliably produce 10–1000× query speedups in production MongoDB deployments.
