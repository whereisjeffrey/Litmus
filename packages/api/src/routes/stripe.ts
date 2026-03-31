import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

export const stripeRoutes = new Hono();

// Create checkout session
stripeRoutes.post("/create-checkout", authMiddleware, async (c) => {
  // TODO: Implement with Stripe
  return c.json({ error: "Not implemented yet" }, 501);
});

// Stripe webhook (no auth — Stripe sends these directly)
stripeRoutes.post("/webhook", async (c) => {
  // TODO: Implement webhook handling
  return c.json({ received: true });
});

// Customer portal session
stripeRoutes.post("/portal", authMiddleware, async (c) => {
  // TODO: Implement with Stripe
  return c.json({ error: "Not implemented yet" }, 501);
});
