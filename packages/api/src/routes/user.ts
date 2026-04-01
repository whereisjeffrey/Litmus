import { Hono } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

export const userRoutes = new Hono();

userRoutes.use("*", authMiddleware);

// Get subscription/plan info
userRoutes.get("/subscription", async (c) => {
  if (!supabaseAdmin) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const user = c.get("user");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", user.id)
    .single();

  return c.json({
    plan: profile?.plan || "free",
    hasStripeCustomer: !!profile?.stripe_customer_id,
  });
});

// Get profile
userRoutes.get("/profile", async (c) => {
  if (!supabaseAdmin) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const user = c.get("user");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    plan: profile.plan,
    createdAt: profile.created_at,
  });
});

// Update profile
userRoutes.put("/profile", async (c) => {
  if (!supabaseAdmin) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const user = c.get("user");
  const { fullName } = await c.req.json();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ profile: data });
});
