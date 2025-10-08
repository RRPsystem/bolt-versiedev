const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const ctxId = url.pathname.split('/').pop();

    if (!ctxId) {
      return new Response('Invalid shortlink', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const ctxBaseUrl = Deno.env.get('CTX_BASE_URL') || 'https://ctx.ai-websitestudio.nl';
    const builderUrl = 'https://www.ai-websitestudio.nl/index.html';

    const redirectUrl = `${builderUrl}?ctx=${ctxId}&ctx_base=${ctxBaseUrl}&edge_badge=0#/mode/page`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error redirecting:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
});