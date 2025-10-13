import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userData, error: dbError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      brand_id
    } = body;

    if (!email || !password || !name || !brand_id) {
      throw new Error('Missing required fields: email, password, name, brand_id');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .single();

    if (!brand) {
      throw new Error('Brand not found');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'agent'
      }
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'agent',
        brand_id,
        name,
        phone
      });

    if (userInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user record: ${userInsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email,
        name,
        brand_id,
        message: 'Agent created successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating agent with user:', error);
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
