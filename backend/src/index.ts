// Local development entry point — imports the shared app and starts the HTTP server.
// On Vercel, api/server.ts imports the app directly without calling listen().
import app, { ensureMongoIndexes } from "./app.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

app.listen(PORT, () => {
  console.info(`[server] AtlasAdvisor API running on http://localhost:${PORT}`);
  void ensureMongoIndexes();
});

export default app;
