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
    console.log('Request:', req.method, url.pathname, 'pathParts:', pathParts);

    // GET /pages-api?brand_id={BRAND}
    if (req.method === "GET" && pathParts[pathParts.length - 1] === "pages-api") {
      const brandId = url.searchParams.get("brand_id");
      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("pages")
        .select("id, brand_id, title, slug, status, updated_at, published_at, version, body_html")
        .eq("brand_id", brandId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /pages-api/saveDraft
    if (req.method === "POST" && pathParts.includes("saveDraft")) {
      const claims = await verifyBearerToken(req);
      const body = await req.json();
      const { brand_id, page_id, title, slug, content_json } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !title || !slug) {
        return new Response(
          JSON.stringify({ error: "brand_id, title, and slug are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let result;
      if (page_id) {
        // Update existing page
        const { data: currentPage } = await supabase
          .from("pages")
          .select("version")
          .eq("id", page_id)
          .single();

        const newVersion = (currentPage?.version || 0) + 1;

        const { data, error } = await supabase
          .from("pages")
          .update({
            title,
            slug,
            content_json,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq("id", page_id)
          .select("id, slug, version")
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new page
        const { data, error } = await supabase
          .from("pages")
          .insert({
            brand_id,
            title,
            slug,
            status: "draft",
            content_json,
            version: 1,
            owner_user_id: claims.user_id || claims.sub || brand_id,
            created_by: claims.user_id || claims.sub,
          })
          .select("id, slug, version")
          .single();

        if (error) throw error;
        result = data;
      }

      return new Response(
        JSON.stringify({ page_id: result.id, slug: result.slug, version: result.version }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /pages-api/{page_id}/publish
    if (req.method === "POST" && pathParts.includes("publish")) {
      const claims = await verifyBearerToken(req);
      const pageId = pathParts[pathParts.length - 2];
      const body = await req.json();
      const { body_html } = body;

      if (!body_html) {
        return new Response(
          JSON.stringify({ error: "body_html is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get page to build URL
      const { data: page, error: fetchError } = await supabase
        .from("pages")
        .select("slug, brand_id, brands(slug)")
        .eq("id", pageId)
        .single();

      if (fetchError) throw fetchError;

      if (page.brand_id !== claims.brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update page status to published
      const { error: updateError } = await supabase
        .from("pages")
        .update({
          status: "published",
          body_html,
          published_at: new Date().toISOString(),
        })
        .eq("id", pageId);

      if (updateError) throw updateError;

      const brandSlug = page.brands?.slug || "brand";
      const url = `/${brandSlug}/${page.slug}`;

      return new Response(
        JSON.stringify({ ok: true, url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /pages-api/{page_id}
    if (req.method === "DELETE") {
      const claims = await verifyBearerToken(req);
      const pageId = pathParts[pathParts.length - 1];

      if (!pageId || pageId === "pages-api") {
        return new Response(
          JSON.stringify({ error: "page_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: page, error: fetchError } = await supabase
        .from("pages")
        .select("brand_id")
        .eq("id", pageId)
        .single();

      if (fetchError) throw fetchError;

      if (page.brand_id !== claims.brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("pages")
        .delete()
        .eq("id", pageId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ ok: true }),
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