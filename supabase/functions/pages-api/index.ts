import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

interface JWTPayload {
  brand_id: string;
  user_id?: string;
  sub?: string;
}

async function verifyBearerToken(req: Request): Promise<JWTPayload> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.substring(7);
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET not configured");
  
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(jwtSecret);
  const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
  if (!payload.brand_id) throw new Error("Invalid token: missing brand_id");
  return payload as JWTPayload;
}

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  headers.set('Access-Control-Allow-Headers', '*');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Content-Type', 'application/json');
  return headers;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (req.method === "POST" && pathParts.includes("saveDraft")) {
      const body = await req.json();
      const claims = await verifyBearerToken(req);
      const { brand_id, page_id, title, slug, content_json } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: corsHeaders() }
        );
      }

      if (!brand_id || !title || !slug) {
        return new Response(
          JSON.stringify({ error: "brand_id, title, and slug required" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      let result;
      
      if (page_id) {
        const { data: currentPage } = await supabase
          .from("pages")
          .select("version")
          .eq("id", page_id)
          .maybeSingle();

        const { data, error } = await supabase
          .from("pages")
          .update({
            title,
            slug,
            content_json,
            version: (currentPage?.version || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", page_id)
          .select("id, slug, version")
          .maybeSingle();

        if (error) throw error;
        result = data;
      } else {
        const { data: existingPage } = await supabase
          .from("pages")
          .select("id, version")
          .eq("brand_id", brand_id)
          .eq("slug", slug)
          .maybeSingle();

        if (existingPage) {
          const { data, error } = await supabase
            .from("pages")
            .update({
              title,
              content_json,
              version: existingPage.version + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPage.id)
            .select("id, slug, version")
            .maybeSingle();

          if (error) throw error;
          result = data;
        } else {
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
            .maybeSingle();

          if (error) throw error;
          result = data;
        }
      }

      return new Response(
        JSON.stringify({ page_id: result.id, slug: result.slug, version: result.version }),
        { status: 200, headers: corsHeaders() }
      );
    }

    if (req.method === "GET" && pathParts.includes("list")) {
      const brandId = url.searchParams.get("brand_id");
      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      let query = supabase
        .from("pages")
        .select("title, slug, show_in_menu, parent_slug, menu_order, status")
        .eq("brand_id", brandId)
        .eq("status", "published");

      if (url.searchParams.get("menu_key")) {
        query = query.eq("show_in_menu", true);
      }

      const { data, error } = await query.order("menu_order", { ascending: true });
      if (error) throw error;

      const pages = (data || []).map(page => ({
        title: page.title,
        slug: page.slug,
        url: `/${page.slug}`,
        show_in_menu: page.show_in_menu,
        parent_slug: page.parent_slug,
        order: page.menu_order
      }));

      return new Response(JSON.stringify({ pages }), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "GET" && pathParts[pathParts.length - 1] === "pages-api") {
      const brandId = url.searchParams.get("brand_id");
      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("brand_id", brandId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ items: data || [] }), { status: 200, headers: corsHeaders() });
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders() }
    );
  }
});