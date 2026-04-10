// Vercel Serverless Function entry point.
// Imports the shared Express app (without calling listen()) and exports it
// as the default handler — @vercel/node adapts it to a serverless context.
import app from "../backend/src/app.js";
export default app;
