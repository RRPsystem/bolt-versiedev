import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyBearerToken } from "../_shared/jwt.ts";

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

    // GET /api/layouts?brand_id={BRAND}&type=header|footer
    if (req.method === "GET" && pathParts[pathParts.length - 1] === "layouts-api") {
      const brandId = url.searchParams.get("brand_id");
      const type = url.searchParams.get("type");

      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabase
        .from("layouts")
        .select("id, brand_id, type, name, content_json, is_default")
        .eq("brand_id", brandId);

      if (type && (type === "header" || type === "footer")) {
        query = query.eq("type", type);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /api/layouts/save
    if (req.method === "POST" && pathParts.includes("save")) {
      const claims = await verifyBearerToken(req);
      const body = await req.json();
      const { brand_id, type, layout_id, name, content_json, is_default } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !type || !name) {
        return new Response(
          JSON.stringify({ error: "brand_id, type, and name are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!['header', 'footer'].includes(type)) {
        return new Response(
          JSON.stringify({ error: "type must be 'header' or 'footer'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let result;
      if (layout_id) {
        // Update existing layout
        const { data, error } = await supabase
          .from("layouts")
          .update({
            name,
            content_json,
            is_default: is_default || false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", layout_id)
          .select("id")
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new layout
        const { data, error } = await supabase
          .from("layouts")
          .insert({
            brand_id,
            type,
            name,
            content_json: content_json || {},
            is_default: is_default || false,
          })
          .select("id")
          .single();

        if (error) throw error;
        result = data;
      }

      return new Response(
        JSON.stringify({ layout_id: result.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});