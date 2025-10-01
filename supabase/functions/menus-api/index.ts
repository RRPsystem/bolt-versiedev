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

    // GET /api/menus?brand_id={BRAND}
    if (req.method === "GET" && pathParts[pathParts.length - 1] === "menus-api") {
      const brandId = url.searchParams.get("brand_id");

      if (!brandId) {
        return new Response(
          JSON.stringify({ error: "brand_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("menus")
        .select("id, brand_id, name")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /api/menus/{id}/items
    if (req.method === "GET" && pathParts.includes("items")) {
      const menuId = pathParts[pathParts.length - 2];

      const { data, error } = await supabase
        .from("menu_items")
        .select("id, parent_id, label, url, order, target, icon")
        .eq("menu_id", menuId)
        .order("order", { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /api/menus/save
    if (req.method === "POST" && pathParts.includes("save")) {
      const claims = await verifyBearerToken(req);
      const body = await req.json();
      const { brand_id, menu_id, name, items } = body;

      if (claims.brand_id !== brand_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: brand_id mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!brand_id || !name) {
        return new Response(
          JSON.stringify({ error: "brand_id and name are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let resultMenuId;

      if (menu_id) {
        // Update existing menu
        const { data, error } = await supabase
          .from("menus")
          .update({
            name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", menu_id)
          .select("id")
          .single();

        if (error) throw error;
        resultMenuId = data.id;
      } else {
        // Create new menu
        const { data, error } = await supabase
          .from("menus")
          .insert({
            brand_id,
            name,
          })
          .select("id")
          .single();

        if (error) throw error;
        resultMenuId = data.id;
      }

      // If items are provided, update them
      if (items && Array.isArray(items) && items.length > 0) {
        // Delete existing items
        await supabase.from("menu_items").delete().eq("menu_id", resultMenuId);

        // Insert new items
        const itemsToInsert = items.map(item => ({
          menu_id: resultMenuId,
          parent_id: item.parent_id || null,
          label: item.label,
          url: item.url,
          order: item.order || 0,
          target: item.target || "_self",
          icon: item.icon || null,
        }));

        const { error: itemsError } = await supabase
          .from("menu_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return new Response(
        JSON.stringify({ menu_id: resultMenuId }),
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