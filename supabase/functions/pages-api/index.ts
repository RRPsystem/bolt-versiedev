import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

// JWT Helper (inline)
interface JWTPayload {
  brand_id: string;
  user_id?: string;
  sub?: string;
  scopes?: string[];
  iat?: number;
  exp?: number;
}

async function verifyBearerToken(req: Request): Promise<JWTPayload> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured");
  }

  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(jwtSecret);

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.brand_id) {
      throw new Error("Invalid token: missing brand_id");
    }

    return payload as JWTPayload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// CORS Helper (inline)
function withCORS(req: Request, resInit: ResponseInit = {}): Headers {
  const origin = req.headers.get('origin') ?? '*';
  const allowedOrigins = [
    'https://www.ai-websitestudio.nl',
    'https://ai-websitestudio.nl',
    'https://www.ai-travelstudio.nl',
    'https://ai-travelstudio.nl',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8000'
  ];

  const isAllowed = allowedOrigins.includes(origin) ||
                   origin.includes('ai-websitestudio.nl') ||
                   origin.includes('ai-travelstudio.nl') ||
                   origin.includes('localhost') ||
                   origin.includes('127.0.0.1');

  const allowOrigin = isAllowed ? origin : '*';

  const headers = new Headers(resInit.headers || {});
  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'authorization,apikey,content-type,x-client-info');

  return headers;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: withCORS(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    console.log('Request:', req.method, url.pathname, 'pathParts:', pathParts);

    if (req.method === "GET" && pathParts.includes("list")) {
      const brandId = url.searchParams.get("brand_id");
      const menuKey = url.searchParams.get("menu_key");

      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      let query = supabase
        .from("pages")
        .select("title, slug, show_in_menu, parent_slug, menu_order, status")
        .eq("brand_id", brandId)
        .eq("status", "published");

      if (menuKey) {
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

      return new Response(
        JSON.stringify({ pages }),
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    if (req.method === "GET" && pathParts[pathParts.length - 1] === "pages-api") {
      const brandId = url.searchParams.get("brand_id");
      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      const { data, error } = await supabase
        .from("pages")
        .select("id, brand_id, title, slug, status, updated_at, published_at, version, body_html, show_in_menu, parent_slug, menu_order")
        .eq("brand_id", brandId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data || [] }),
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    if (req.method === "POST" && pathParts.includes("updateMenuSettings")) {
      const claims = await verifyBearerToken(req);
      const body = await req.json();
      const { page_id, show_in_menu, parent_slug, menu_order } = body;

      if (!page_id) {
        return new Response(
          JSON.stringify({ error: "page_id is required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      const { data: page, error: fetchError } = await supabase
        .from("pages")
        .select("brand_id")
        .eq("id", page_id)
        .single();

      if (fetchError) throw fetchError;

      if (page.brand_id !== claims.brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      const updates: any = {};
      if (show_in_menu !== undefined) updates.show_in_menu = show_in_menu;
      if (parent_slug !== undefined) updates.parent_slug = parent_slug;
      if (menu_order !== undefined) updates.menu_order = menu_order;

      const { error: updateError } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", page_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    if (req.method === "POST" && pathParts.includes("saveDraft")) {
      const claims = await verifyBearerToken(req);
      const body = await req.json();
      const { brand_id, page_id, title, slug, content_json, show_in_menu, parent_slug, menu_order } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      if (!brand_id || !title || !slug) {
        return new Response(
          JSON.stringify({ error: "brand_id, title, and slug are required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      let result;
      if (page_id) {
        const { data: currentPage } = await supabase
          .from("pages")
          .select("version")
          .eq("id", page_id)
          .single();

        const newVersion = (currentPage?.version || 0) + 1;

        const updateData: any = {
          title,
          slug,
          content_json,
          version: newVersion,
          updated_at: new Date().toISOString(),
        };

        if (show_in_menu !== undefined) updateData.show_in_menu = show_in_menu;
        if (parent_slug !== undefined) updateData.parent_slug = parent_slug;
        if (menu_order !== undefined) updateData.menu_order = menu_order;

        const { data, error } = await supabase
          .from("pages")
          .update(updateData)
          .eq("id", page_id)
          .select("id, slug, version")
          .single();

        if (error) throw error;
        result = data;
      } else {
        const insertData: any = {
          brand_id,
          title,
          slug,
          status: "draft",
          content_json,
          version: 1,
          owner_user_id: claims.user_id || claims.sub || brand_id,
          created_by: claims.user_id || claims.sub,
        };

        if (show_in_menu !== undefined) insertData.show_in_menu = show_in_menu;
        if (parent_slug !== undefined) insertData.parent_slug = parent_slug;
        if (menu_order !== undefined) insertData.menu_order = menu_order;

        const { data, error } = await supabase
          .from("pages")
          .insert(insertData)
          .select("id, slug, version")
          .single();

        if (error) throw error;
        result = data;
      }

      return new Response(
        JSON.stringify({ page_id: result.id, slug: result.slug, version: result.version }),
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    if (req.method === "POST" && pathParts.includes("publish")) {
      const claims = await verifyBearerToken(req);
      const pageId = pathParts[pathParts.length - 2];
      const body = await req.json();
      const { body_html } = body;

      if (!body_html) {
        return new Response(
          JSON.stringify({ error: "body_html is required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      const { data: page, error: fetchError } = await supabase
        .from("pages")
        .select("slug, brand_id, brands(slug)")
        .eq("id", pageId)
        .single();

      if (fetchError) throw fetchError;

      if (page.brand_id !== claims.brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

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
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    if (req.method === "DELETE") {
      const claims = await verifyBearerToken(req);
      const pageId = pathParts[pathParts.length - 1];

      if (!pageId || pageId === "pages-api") {
        return new Response(
          JSON.stringify({ error: "page_id is required" }),
          { status: 400, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
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
          { status: 403, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
        );
      }

      const { error: deleteError } = await supabase
        .from("pages")
        .delete()
        .eq("id", pageId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
    );
  } catch (error) {
    console.error("Error in pages-api:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: withCORS(req, { headers: { "Content-Type": "application/json" } }) }
    );
  }
});