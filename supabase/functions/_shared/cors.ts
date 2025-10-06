export function withCORS(req: Request, resInit: ResponseInit = {}): Headers {
  const origin = req.headers.get('origin') ?? '*';
  const allowedOrigins = [
    'https://www.ai-websitestudio.nl',
    'https://www.ai-travelstudio.nl',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = new Headers(resInit.headers || {});
  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'authorization,apikey,content-type,x-client-info');

  return headers;
}
