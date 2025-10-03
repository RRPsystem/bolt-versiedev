import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyBearerToken } from "./_shared/jwt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // GET /layouts-api/{brand_id}/published - Public endpoint for renderer
    if (req.method === "GET" && pathParts.length >= 2) {
      const brandId = pathParts[pathParts.length - 2];
      const action = pathParts[pathParts.length - 1];

      if (action === "published") {
        const { data, error } = await supabase
          .from("brand_layouts")
          .select("header_html, footer_html, menu_json, version")
          .eq("brand_id", brandId)
          .eq("status", "published")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          return new Response(
            JSON.stringify({
              header_html: "",
              footer_html: "",
              menu_json: [],
              version: 0
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // All POST endpoints require JWT authentication
    const claims = await verifyBearerToken(req);

    // POST /layouts-api/header/saveDraft
    if (req.method === "POST" && pathParts.includes("header") && pathParts.includes("saveDraft")) {
      const body = await req.json();
      const { brand_id, content_json } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !content_json) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id and content_json are required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          header_json: content_json,
          status: "draft"
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /layouts-api/header/publish
    if (req.method === "POST" && pathParts.includes("header") && pathParts.includes("publish")) {
      const body = await req.json();
      const { brand_id, body_html } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !body_html) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id and body_html are required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current version and increment
      const { data: current } = await supabase
        .from("brand_layouts")
        .select("version")
        .eq("brand_id", brand_id)
        .maybeSingle();

      const newVersion = (current?.version || 0) + 1;

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          header_html: body_html,
          status: "published",
          version: newVersion
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /layouts-api/footer/saveDraft
    if (req.method === "POST" && pathParts.includes("footer") && pathParts.includes("saveDraft")) {
      const body = await req.json();
      const { brand_id, content_json } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !content_json) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id and content_json are required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          footer_json: content_json,
          status: "draft"
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /layouts-api/footer/publish
    if (req.method === "POST" && pathParts.includes("footer") && pathParts.includes("publish")) {
      const body = await req.json();
      const { brand_id, body_html } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !body_html) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id and body_html are required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current version and increment
      const { data: current } = await supabase
        .from("brand_layouts")
        .select("version")
        .eq("brand_id", brand_id)
        .maybeSingle();

      const newVersion = (current?.version || 0) + 1;

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          footer_html: body_html,
          status: "published",
          version: newVersion
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /layouts-api/menu/saveDraft
    if (req.method === "POST" && pathParts.includes("menu") && pathParts.includes("saveDraft")) {
      const body = await req.json();
      const { brand_id, menu_json } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !menu_json) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id and menu_json are required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          menu_json,
          status: "draft"
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /layouts-api/menu/publish
    if (req.method === "POST" && pathParts.includes("menu") && pathParts.includes("publish")) {
      const body = await req.json();
      const { brand_id } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "brand_id mismatch" } }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id) {
        return new Response(
          JSON.stringify({ error: { code: "INVALID_REQUEST", message: "brand_id is required" } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current version and increment
      const { data: current } = await supabase
        .from("brand_layouts")
        .select("version")
        .eq("brand_id", brand_id)
        .maybeSingle();

      const newVersion = (current?.version || 0) + 1;

      const { data, error } = await supabase
        .from("brand_layouts")
        .upsert({
          brand_id,
          status: "published",
          version: newVersion
        }, {
          onConflict: "brand_id"
        })
        .select("version, updated_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, version: data.version, updated_at: data.updated_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "Endpoint not found" } }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);

    if (error.message?.includes("JWT")) {
      return new Response(
        JSON.stringify({ error: { code: "INVALID_TOKEN", message: error.message } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: error.message } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});