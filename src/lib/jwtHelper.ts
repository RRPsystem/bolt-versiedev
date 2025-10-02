export interface BuilderJWTPayload {
  brand_id: string;
  sub: string;
  scope: string[];
  exp: number;
  iat: number;
}

/**
 * Generates a JWT token for the builder by calling the server-side Edge Function
 */
export async function generateBuilderJWT(
  brandId: string,
  userId: string,
  scopes: string[] = ['pages:write', 'layouts:write', 'menus:write']
): Promise<string> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-builder-jwt`;

  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const userToken = localStorage.getItem('supabase.auth.token');

  let authToken = supabaseAnonKey;
  if (userToken) {
    try {
      const tokenData = JSON.parse(userToken);
      if (tokenData.access_token) {
        authToken = tokenData.access_token;
      }
    } catch (e) {
      console.warn('Failed to parse user token');
    }
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      brand_id: brandId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate JWT');
  }

  const data = await response.json();
  return data.token;
}

export function generateBuilderDeeplink(
  brandId: string,
  token: string,
  options: {
    pageId?: string;
    templateId?: string;
    menuId?: string;
    headerId?: string;
    footerId?: string;
  } = {}
): string {
  const builderBaseUrl = 'https://sitebuilderprod-sywg.vercel.app/index.html';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiBaseUrl = supabaseUrl ? supabaseUrl.replace('/functions/v1', '') : window.location.origin;

  const params = new URLSearchParams({
    brand_id: brandId,
    token: token,
    api: apiBaseUrl
  });

  if (options.pageId) {
    params.append('page_id', options.pageId);
  }

  if (options.templateId) {
    params.append('template_id', options.templateId);
  }

  if (options.menuId) {
    params.append('menu_id', options.menuId);
  }

  if (options.headerId) {
    params.append('header_id', options.headerId);
  }

  if (options.footerId) {
    params.append('footer_id', options.footerId);
  }

  return `${builderBaseUrl}?${params.toString()}`;
}

/**
 * Extract JWT token and brand_id from deeplink URL
 * Call this when Builder receives a deeplink from Bolt.new
 */
export function parseDeeplinkParams(): {
  brandId: string | null;
  token: string | null;
  apiBaseUrl: string | null;
  pageId?: string;
  menuId?: string;
  headerId?: string;
  footerId?: string;
} {
  const params = new URLSearchParams(window.location.search);

  return {
    brandId: params.get('brand_id'),
    token: params.get('token'),
    apiBaseUrl: params.get('api'),
    pageId: params.get('page_id') || undefined,
    menuId: params.get('menu_id') || undefined,
    headerId: params.get('header_id') || undefined,
    footerId: params.get('footer_id') || undefined,
  };
}
