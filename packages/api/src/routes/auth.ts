import { Hono } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

export const authRoutes = new Hono();

// Sign up
authRoutes.post("/signup", async (c) => {
  try {
    const { email, password, fullName } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "" },
      },
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user, session: data.session });
  } catch (err) {
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Sign in
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ user: data.user, session: data.session });
  } catch (err) {
    return c.json({ error: "Login failed" }, 500);
  }
});

// Sign out
authRoutes.post("/logout", authMiddleware, async (c) => {
  try {
    const token = c.get("accessToken");
    await supabaseAdmin.auth.admin.signOut(token);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Logout failed" }, 500);
  }
});

// Get current user
authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return c.json({ user: profile || { id: user.id, email: user.email, plan: "free" } });
});
