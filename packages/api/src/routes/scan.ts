import { Hono } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

export const scanRoutes = new Hono();

// All scan routes require auth
scanRoutes.use("*", authMiddleware);

// Save a scan
scanRoutes.post("/save", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const { data: scan, error: scanError } = await supabaseAdmin
      .from("scans")
      .insert({
        user_id: user.id,
        url: body.url,
        page_type: body.pageType,
        overall_score: body.overallScore,
        viewport_mode: body.viewportMode || "desktop",
        category_scores: body.categoryScores || {},
        ai_analysis: body.aiAnalysis || null,
      })
      .select()
      .single();

    if (scanError) {
      return c.json({ error: scanError.message }, 500);
    }

    // Save findings
    if (body.findings && body.findings.length > 0) {
      const findingsToInsert = body.findings.map((f: any) => ({
        scan_id: scan.id,
        scanner: f.scanner,
        severity: f.severity,
        title: f.title,
        description: f.description,
        selector: f.selector || null,
        standard: f.standard || null,
      }));

      const { error: findingsError } = await supabaseAdmin
        .from("findings")
        .insert(findingsToInsert);

      if (findingsError) {
        console.error("Error saving findings:", findingsError);
      }
    }

    return c.json({ id: scan.id, createdAt: scan.created_at });
  } catch (err) {
    return c.json({ error: "Failed to save scan" }, 500);
  }
});

// Get scan history
scanRoutes.get("/history", async (c) => {
  try {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "20", 10);
    const offset = parseInt(c.req.query("offset") || "0", 10);

    const { data, error, count } = await supabaseAdmin
      .from("scans")
      .select("id, url, page_type, overall_score, viewport_mode, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ scans: data, total: count });
  } catch (err) {
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

// Get a specific scan with findings
scanRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const scanId = c.req.param("id");

    const { data: scan, error: scanError } = await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .eq("user_id", user.id)
      .single();

    if (scanError || !scan) {
      return c.json({ error: "Scan not found" }, 404);
    }

    const { data: findings } = await supabaseAdmin
      .from("findings")
      .select("*")
      .eq("scan_id", scanId)
      .order("severity", { ascending: true });

    return c.json({ scan, findings: findings || [] });
  } catch (err) {
    return c.json({ error: "Failed to fetch scan" }, 500);
  }
});
