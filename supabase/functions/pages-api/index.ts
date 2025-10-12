import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

interface JWTPayload {
  brand_id: string;
  user_id?: string;
  sub?: string;
  scope?: string[];
}

async function verifyBearerToken(req: Request, requiredScope?: string): Promise<JWTPayload> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Missing or invalid Authorization header");
    (error as any).statusCode = 401;
    throw error;
  }
  const token = authHeader.substring(7);
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) {
    const error = new Error("JWT_SECRET not configured");
    (error as any).statusCode = 500;
    throw error;
  }

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(jwtSecret);
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const typedPayload = payload as unknown as JWTPayload;
    if (requiredScope && (!typedPayload.scope || !typedPayload.scope.includes(requiredScope))) {
      const error = new Error(`Missing required scope: ${requiredScope}`);
      (error as any).statusCode = 403;
      throw error;
    }
    return typedPayload;
  } catch (err) {
    if ((err as any).statusCode) {
      throw err;
    }
    const error = new Error(`Invalid JWT: ${err.message}`);
    (error as any).statusCode = 401;
    throw error;
  }
}

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');
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

    console.log("[DEBUG] Request:", {
      method: req.method,
      pathname: url.pathname,
      pathParts,
      hasAuth: req.headers.has("Authorization")
    });

    if (req.method === "POST" && (pathParts.includes("saveDraft") || pathParts.includes("save"))) {
      console.log("[DEBUG] Processing saveDraft/save");
      const body = await req.json();
      console.log("[DEBUG] Body:", {
        has_brand_id: !!body.brand_id,
        has_page_id: !!body.page_id,
        title: body.title,
        slug: body.slug
      });

      const claims = await verifyBearerToken(req, "content:write");
      console.log("[DEBUG] Claims verified:", { brand_id: claims.brand_id, sub: claims.sub });

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
            status: "draft",
            version: (currentPage?.version || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", page_id)
          .select("id, slug")
          .maybeSingle();

        if (error) throw error;
        result = data;
      } else {
        console.log("[DEBUG] No page_id provided, creating new page with unique slug");

        let finalSlug = slug;
        let slugSuffix = 1;

        while (true) {
          const { data } = await supabase
            .from("pages")
            .select("id, slug")
            .eq("brand_id", brand_id)
            .eq("slug", finalSlug)
            .maybeSingle();

          if (!data) {
            break;
          }

          slugSuffix++;
          const baseSlug = slug.replace(/-\d+$/, '');
          finalSlug = `${baseSlug}-${slugSuffix}`;
          console.log(`[DEBUG] Slug '${slug}' exists, trying '${finalSlug}'`);
        }

        const userId = claims.sub || claims.user_id;
        const finalTitle = slugSuffix > 1 ? `${title} ${slugSuffix}` : title;

        console.log(`[DEBUG] Creating new page with slug: ${finalSlug}, title: ${finalTitle}`);

        const { data, error } = await supabase
          .from("pages")
          .insert({
            brand_id,
            title: finalTitle,
            slug: finalSlug,
            content_json,
            status: "draft",
            version: 1,
            content_type: "page",
            show_in_menu: false,
            menu_order: 0,
            parent_slug: null,
            owner_user_id: userId,
            created_by: userId
          })
          .select("id, slug")
          .maybeSingle();

        if (error) throw error;
        result = data;
      }

      const responseData = {
        brand_id,
        page_id: result.id,
        title,
        slug: result.slug,
        content_json,
        status: "draft"
      };

      console.log("[DEBUG] Sending success response:", responseData);

      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: corsHeaders() }
      );
    }

    if (req.method === "POST" && pathParts.includes("publish")) {
      const body = await req.json();
      const claims = await verifyBearerToken(req, "content:write");
      const pageId = pathParts[pathParts.length - 2];
      const { body_html } = body;

      if (!pageId || pageId === "pages-api") {
        return new Response(
          JSON.stringify({ error: "Invalid page_id in URL" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const { data: page, error: fetchError } = await supabase
        .from("pages")
        .select("brand_id, version")
        .eq("id", pageId)
        .maybeSingle();

      if (fetchError || !page) {
        return new Response(
          JSON.stringify({ error: "Page not found" }),
          { status: 404, headers: corsHeaders() }
        );
      }

      if (claims.brand_id !== page.brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: corsHeaders() }
        );
      }

      const { data, error } = await supabase
        .from("pages")
        .update({
          body_html,
          status: "published",
          version: (page.version || 0) + 1,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId)
        .select("id, slug, version")
        .maybeSingle();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          page_id: data.id,
          slug: data.slug,
          version: data.version,
          message: "Page published successfully"
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    if (req.method === "GET" && pathParts.includes("list")) {
      const claims = await verifyBearerToken(req, "content:read");
      const brandId = url.searchParams.get("brand_id") || claims.brand_id;

      if (claims.brand_id !== brandId) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: corsHeaders() }
        );
      }

      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("brand_id", brandId)
        .or("content_type.eq.page,content_type.is.null")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ items: data || [] }), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "GET" && pathParts.length >= 2) {
      const pageId = pathParts[pathParts.length - 1];
      if (pageId !== "pages-api" && pageId !== "list") {
        const claims = await verifyBearerToken(req, "content:read");

        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", pageId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: "Page not found" }),
            { status: 404, headers: corsHeaders() }
          );
        }

        if (claims.brand_id !== data.brand_id) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: corsHeaders() }
          );
        }

        return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
      }
    }

    if (req.method === "DELETE" && pathParts.length >= 2) {
      const pageId = pathParts[pathParts.length - 1];
      if (pageId !== "pages-api") {
        const claims = await verifyBearerToken(req, "content:write");

        const { data: page, error: fetchError } = await supabase
          .from("pages")
          .select("brand_id")
          .eq("id", pageId)
          .maybeSingle();

        if (fetchError || !page) {
          return new Response(
            JSON.stringify({ error: "Page not found" }),
            { status: 404, headers: corsHeaders() }
          );
        }

        if (claims.brand_id !== page.brand_id) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: corsHeaders() }
          );
        }

        const { error } = await supabase
          .from("pages")
          .delete()
          .eq("id", pageId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Page deleted successfully" }),
          { status: 200, headers: corsHeaders() }
        );
      }
    }

    if (req.method === "GET" && (url.pathname.endsWith("/pages") || url.pathname.endsWith("/pages-api"))) {
      const apikey = url.searchParams.get("apikey");
      const preview = url.searchParams.get("preview");
      const brand_id = url.searchParams.get("brand_id");
      const page_id = url.searchParams.get("page_id");

      if (page_id) {
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", page_id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: "Page not found" }),
            { status: 404, headers: corsHeaders() }
          );
        }

        return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
      }

      if (apikey) {
        const { data: apiSettings, error: apiError } = await supabase
          .from("api_settings")
          .select("api_key, brand_id, can_read_content")
          .eq("api_key", apikey)
          .maybeSingle();

        if (apiError || !apiSettings || !apiSettings.can_read_content) {
          return new Response(
            JSON.stringify({ error: "Invalid API key or insufficient permissions" }),
            { status: 403, headers: corsHeaders() }
          );
        }

        let query = supabase
          .from("pages")
          .select("*")
          .eq("brand_id", apiSettings.brand_id)
          .or("content_type.eq.page,content_type.is.null");

        if (preview !== "true") {
          query = query.eq("status", "published");
        }

        const { data, error } = await query.order("updated_at", { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ items: data || [] }), { status: 200, headers: corsHeaders() });
      } else {
        if (!brand_id) {
          return new Response(
            JSON.stringify({ error: "brand_id is required" }),
            { status: 400, headers: corsHeaders() }
          );
        }

        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("brand_id", brand_id)
          .or("content_type.eq.page,content_type.is.null")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ items: data || [] }), { status: 200, headers: corsHeaders() });
      }
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[ERROR] Full error:", error);
    console.error("[ERROR] Error message:", error?.message);
    console.error("[ERROR] Error stack:", error?.stack);
    const statusCode = (error as any).statusCode || 500;
    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error",
        details: error?.toString(),
        timestamp: new Date().toISOString()
      }),
      { status: statusCode, headers: corsHeaders() }
    );
  }
});
