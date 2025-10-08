import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface MintRequest {
  brand_id: string;
  type: 'page' | 'news';
  page_id?: string;
  slug?: string;
  news_slug?: string;
  ttl_minutes?: number;
  ephemeral?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: MintRequest = await req.json();
    const {
      brand_id,
      type,
      page_id,
      slug,
      news_slug,
      ttl_minutes = 15,
      ephemeral = true,
    } = body;

    if (!brand_id || !type) {
      return new Response(
        JSON.stringify({ error: 'brand_id and type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (type === 'page' && (!page_id || !slug)) {
      return new Response(
        JSON.stringify({ error: 'page_id and slug required for page type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (type === 'news' && !news_slug) {
      return new Response(
        JSON.stringify({ error: 'news_slug required for news type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const exp = Math.floor(Date.now() / 1000) + ttl_minutes * 60;
    const ctx_id = generateShortId();

    const jwtPayload = {
      brand_id,
      page_id: page_id || null,
      news_slug: news_slug || null,
      slug: slug || null,
      exp,
    };

    const privateKey = Deno.env.get('WB_CTX_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    const publicKey = Deno.env.get('WB_CTX_PUBLIC_KEY')?.replace(/\\n/g, '\n');

    if (!privateKey || !publicKey) {
      return new Response(
        JSON.stringify({ error: 'Keys not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = await signJWT(jwtPayload, privateKey);

    const ctx = {
      api: `${Deno.env.get('SUPABASE_URL')}/functions/v1`,
      token,
      apikey: Deno.env.get('SUPABASE_ANON_KEY'),
      brand_id,
      page_id: page_id || null,
      news_slug: news_slug || null,
      slug: slug || null,
      exp,
      ephemeral,
      sig: '',
      pub: publicKey,
    };

    const signature = await signContext(ctx, privateKey);
    ctx.sig = signature;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const expiresAt = new Date(exp * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('wbctx_storage')
      .insert({
        id: ctx_id,
        ctx_data: ctx,
        expires_at: expiresAt,
        used: false,
        ephemeral,
      });

    if (insertError) {
      console.error('Error storing context:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store context' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const shortlink = `https://wb.ai/s/${ctx_id}`;

    return new Response(
      JSON.stringify({
        ctx_id,
        shortlink,
        ctx,
        expires_at: expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error minting context:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function signJWT(payload: any, privateKey: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await signRS256(message, privateKey);

  return `${message}.${signature}`;
}

async function signContext(ctx: any, privateKey: string): Promise<string> {
  const canonical = {
    api: ctx.api,
    apikey: ctx.apikey,
    brand_id: ctx.brand_id,
    ephemeral: ctx.ephemeral,
    exp: ctx.exp,
    news_slug: ctx.news_slug,
    page_id: ctx.page_id,
    slug: ctx.slug,
    token: ctx.token,
  };

  const message = JSON.stringify(canonical);
  return await signRS256(message, privateKey);
}

async function signRS256(message: string, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const pemContent = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = base64ToArrayBuffer(pemContent);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    data
  );

  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(input: string | Uint8Array): string {
  let base64;
  if (typeof input === 'string') {
    base64 = btoa(input);
  } else {
    base64 = btoa(String.fromCharCode(...input));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
