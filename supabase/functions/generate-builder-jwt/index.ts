import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT } from 'npm:jose@5';

async function signJWT(payload: any): Promise<string> {
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured");
  }

  console.log("[JWT] Secret available:", { length: jwtSecret.length, first10: jwtSecret.substring(0, 10) });

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(jwtSecret);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    const requestedScopes = requestBody.scopes || ['pages:read', 'pages:write', 'layouts:read', 'layouts:write', 'menus:read', 'menus:write', 'content:read', 'content:write'];

    const { data: userData, error: dbError } = await supabaseClient
      .from('users')
      .select('brand_id, role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      throw new Error('User data not found');
    }

    let brandId = userData.brand_id;

    if (requestBody.brand_id && requestBody.forceBrandId) {
      brandId = requestBody.brand_id;
      console.log('[JWT] Force brand ID:', { requested: requestBody.brand_id, user_role: userData.role });
    }

    if (!brandId) {
      throw new Error('User has no brand assigned');
    }

    console.log('[JWT] Final brand ID:', { brandId, user_role: userData.role, forced: !!requestBody.forceBrandId });

    const payload = {
      brand_id: brandId,
      sub: user.id,
      scope: requestedScopes,
    };

    const jwt = await signJWT(payload);
    console.log("[JWT] Token generated:", { length: jwt.length, first30: jwt.substring(0, 30), scopes: requestedScopes });

    const apiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
    const apiKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    return new Response(
      JSON.stringify({
        token: jwt,
        brand_id: brandId,
        api_url: apiUrl,
        api_key: apiKey
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating JWT:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});