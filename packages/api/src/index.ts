import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "dotenv/config";

import { scanRoutes } from "./routes/scan";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { stripeRoutes } from "./routes/stripe";
import { aiRoutes } from "./routes/ai";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["chrome-extension://*", "http://localhost:*", "https://*.vercel.app"],
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/scan", scanRoutes);
app.route("/api/user", userRoutes);
app.route("/api/stripe", stripeRoutes);
app.route("/api/ai", aiRoutes);

// 404
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = parseInt(process.env.PORT || "3001", 10);
console.log(`API server starting on port ${port}`);
serve({ fetch: app.fetch, port });
