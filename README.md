# AtlasAdvisor

AtlasAdvisor is a demo-ready web app that connects to a MongoDB database, inspects collections, and surfaces **index**, **schema**, and **query**-oriented performance recommendations with concrete fix suggestions and code examples. Each session is randomly assigned to **Variant A** (issues sorted by severity) or **Variant B** (issues grouped by category) so you can compare engagement in the Metrics tab.

## Prerequisites

- **Node.js** 18+
- **MongoDB** reachable from your machine (for your own connection string, metrics storage, and optional sample/upload flows)

> **Local setup:** MongoDB must be running before starting the backend. If you installed via Homebrew:
> ```bash
> brew services start mongodb-community
> ```

## Installation

Install dependencies in **both** packages from the repo root:

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## How to run

Use two terminals:

```bash
# Terminal 1 — API (port 3001)
cd backend
npm run dev

# Terminal 2 — UI (port 5173; proxies /api to the backend)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How it works

**Analysis engine.** The backend lists collections, samples documents, reads index metadata, and uses estimated counts where needed. It emits structured recommendations (severity, category, title, description, fix text, and a code snippet). Analysis runs against the database you specify; the connection is opened per request (with a 5-second timeout) and closed when the run finishes. An empty database or one with no collections returns a clear "no collections found" message instead of a false "all clear".

**A/B testing module.** On first load, the UI assigns Variant A or B (50/50) and a stable `sessionId`, both stored in `localStorage`. Each recommendation card reports `recommendation_viewed`, expanding the fix fires `recommendation_clicked`, and "Mark as applied" / "Dismiss" send `fix_applied` / `fix_dismissed`. Events are written to the `ab_test_events` collection in the metrics database. A TTL index expires events after 30 days automatically, and a compound index on `(variant, timestamp)` keeps aggregation fast.

**Metrics dashboard.** The Metrics tab calls `GET /api/metrics`, which aggregates events per variant: sessions, views, clicks, CTR (clicks/views), and apply rate (applied/views). A Recharts bar chart compares variants; the dashboard auto-refreshes every 30 seconds. Shows a skeleton loader while fetching and a clear empty state when no events have been recorded yet. You can reset all A/B data from the UI.

**Results UI.** Recommendations show severity (HIGH / MEDIUM / LOW) and category (index / schema / query) filter pills — filtering is instant, client-side. Each code example has a copy-to-clipboard button with "Copied!" feedback. Analysis requests have a 60-second timeout with a user-friendly message if exceeded.

## Design decisions

1. **Native MongoDB driver instead of Mongoose** — The analyser only needs ad hoc reads (`listCollections`, `indexes`, sampled `find`, `estimatedDocumentCount`) and predictable connection lifecycle. The driver keeps the stack small and matches how many teams script against MongoDB in production.

2. **Zod for request validation** — Connection strings, database names, and event payloads are validated at the API boundary with clear 400 responses, keeping invalid data out of the analyser and metrics code paths.

3. **Separate metrics database connection** — User-supplied URIs are used only for analysis (and closed afterward). A long-lived client points at `METRICS_DB_URI` for events and global counters so telemetry does not share the analysed cluster's credentials and stays writable even when the target DB is read-only or remote.

4. **Rate limiting** — Analysis endpoints are limited to 10 req/min per IP, event tracking to 120 req/min, and metrics reads/deletes to 60 req/min via `express-rate-limit`.

5. **Security headers** — `helmet` is applied globally, adding standard headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.). CORS is restricted to the configured `ALLOWED_ORIGIN`.

6. **Error boundary** — A React class-based `ErrorBoundary` wraps the entire app, catching render-time errors and showing a branded fallback UI with a reload button.

## Connecting to a database

Three modes are available on the Analyse tab:

**My Own Database** — Paste any MongoDB URI (local or Atlas `mongodb+srv://`) and a database name. The backend returns specific errors for auth failures, unreachable servers, and empty databases.

**Sample Dataset** — Choose one of eight Atlas-style sample database names from a dropdown. Requires sample data loaded at `SAMPLE_MONGODB_URI`.

**Upload File** — Upload a `.json` file of documents (max 1,000 docs, 10 MB). The backend seeds a UUID-isolated temporary database, runs analysis, then drops it.

## Environment

Copy `backend/.env.example` to `backend/.env`. Defaults work for local MongoDB.

| Variable             | Default                     | Description                                          |
|----------------------|-----------------------------|------------------------------------------------------|
| `PORT`               | `3001`                      | API server port                                      |
| `METRICS_DB_URI`     | `mongodb://localhost:27017` | A/B events and global stats                          |
| `METRICS_DB_NAME`    | `atlasadvisor_metrics`      | Metrics database name                                |
| `SAMPLE_MONGODB_URI` | `mongodb://localhost:27017` | Connection for Sample Dataset mode                   |
| `ALLOWED_ORIGIN`     | `http://localhost:5173`     | CORS origin — set to your frontend URL in production |

Optional — frontend Open Graph / canonical URLs: copy `frontend/.env.example` to `frontend/.env` and set `VITE_SITE_URL` (origin only, no trailing slash) before `npm run build`.

## Tests

```bash
cd backend && npm test
```

Eight unit tests (analyser + metrics), mocked MongoDB driver — no live database required.

## Metrics tab

Shows A/B engagement (sessions, views, clicks, CTR, apply rate) with a grouped bar chart.

- Shows a skeleton loader on first fetch and an empty state when no events have been recorded yet.
- **Reset All Metrics** — Deletes all A/B event data after confirmation.

A global counter below the header shows how many databases have been analysed in total (`GET /api/stats`). The count is re-fetched from the server after each successful analysis so it always reflects the true value.

## Project structure

```
backend/src/
  index.ts               server entry, middleware (helmet, cors, rate limiters), route mounting,
                         health check, index creation on startup
  routes/
    analyse.ts           POST /api/analyse
    sample.ts            POST /api/analyse/sample
    upload.ts            POST /api/analyse/upload
    events.ts            POST /api/events
    stats.ts             GET /api/stats
  services/              analyser, metrics aggregation
  utils/mongo.ts         connection helpers — per-request client (5s timeout) + singleton metrics client

frontend/src/
  App.tsx                layout, tabs, global stats counter, skip-to-content link
  components/
    ConnectionForm.tsx   own / sample / upload mode selector with accessible error regions
    RecommendationList.tsx  results with severity + category filter pills (aria-pressed)
    RecommendationCard.tsx  copy-to-clipboard on code examples, A/B event tracking
    MetricsDashboard.tsx skeleton loader, empty state, reset + refresh
    ErrorBoundary.tsx    catches render errors with branded fallback UI
  hooks/
    useAnalysis.ts       fetch with 60s AbortController timeout, 429-aware error messages
    useVariant.ts        A/B assignment + session ID via localStorage
```

## Results

<img width="933" height="877" alt="Screenshot 2026-04-06 at 4 14 02 PM" src="https://github.com/user-attachments/assets/548d6306-472e-44a5-b307-0820e37dfeeb" />
<img width="815" height="595" alt="Screenshot 2026-04-06 at 4 13 49 PM" src="https://github.com/user-attachments/assets/d3d9d53f-45af-4e64-ab7d-47d2136eb8b6" />
