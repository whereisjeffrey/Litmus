import type { Context, Next } from "hono";
import { supabaseAdmin } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
}

// Extend Hono's context variables
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    accessToken: string;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    c.set("user", { id: user.id, email: user.email || "" });
    c.set("accessToken", token);

    await next();
  } catch (err) {
    return c.json({ error: "Authentication failed" }, 401);
  }
}
