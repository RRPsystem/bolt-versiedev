# WebBuilder Context (wbctx) System

## Overview

The wbctx system provides secure, short-lived context tokens for embedding the website builder in external environments. It replaces long URL parameters with a single `ctx=<id>` parameter and validates requests using RS256 signatures.

## Architecture

### 1. Context Token Structure

```json
{
  "api": "https://your-supabase-project.supabase.co/functions/v1",
  "token": "eyJhbGc...",
  "apikey": "eyJhbGc...",
  "brand_id": "uuid",
  "page_id": "uuid",
  "news_slug": "optional-news-slug",
  "slug": "page-slug",
  "exp": 1234567890,
  "ephemeral": true,
  "sig": "RS256-signature",
  "pub": "-----BEGIN PUBLIC KEY-----\n..."
}
```

### 2. Field Descriptions

- **api**: Supabase Functions base URL
- **token**: Builder JWT (short-lived, scoped to specific page/news)
- **apikey**: Supabase anon key
- **brand_id**: Brand UUID
- **page_id**: Page UUID (for page mode)
- **news_slug**: News article slug (for news mode)
- **slug**: Page slug
- **exp**: Unix timestamp when token expires
- **ephemeral**: If true, token is single-use
- **sig**: RS256 signature over canonical JSON fields
- **pub**: Public key for signature verification

### 3. Signature Validation

The signature is calculated over these fields in this exact order:
```javascript
["api","token","apikey","brand_id","page_id","news_slug","slug","exp","ephemeral"]
```

Canonical JSON rules:
- No whitespace
- Fields in alphabetical order
- Null values included as `null`
- Boolean values as `true`/`false`

Example canonical string:
```json
{"api":"https://...","apikey":"...","brand_id":"...","ephemeral":true,"exp":1234567890,"news_slug":null,"page_id":"...","slug":"...","token":"..."}
```

### 4. Bootstrap Flow

```
1. User clicks shortlink: https://wb.ai/s/<id>
2. Redirects to: https://www.ai-websitestudio.nl/index.html?ctx=<id>&ctx_base=https://ctx.yourdomain.nl&edge_badge=0#/mode/page
3. Builder loads and fetches: https://ctx.yourdomain.nl/wbctx/<id>.json
4. Builder validates signature using pub key
5. Builder validates exp timestamp
6. Builder uses token + apikey to call Pages API
7. If ephemeral=true, token is invalidated after use
```

### 5. Security Features

- **Short-lived**: Tokens expire after 10-15 minutes (configurable)
- **Ephemeral**: Single-use tokens for maximum security
- **RS256 Signature**: Prevents tampering
- **Minimal Scopes**: JWT only has access to specific page/news
- **Public Key Validation**: Client verifies signature before use

### 6. API Endpoints

#### Mint Token
```
POST /api/wbctx/mint
Content-Type: application/json

{
  "brand_id": "uuid",
  "type": "page" | "news",
  "page_id": "uuid",
  "slug": "page-slug",
  "news_slug": "news-slug",
  "ttl_minutes": 15,
  "ephemeral": true
}

Response:
{
  "ctx_id": "short-id",
  "shortlink": "https://wb.ai/s/<id>",
  "ctx": { ...full context object... },
  "expires_at": "2025-10-08T17:00:00Z"
}
```

#### Serve Context
```
GET /wbctx/<id>.json

Response:
{ ...context object with sig and pub... }
```

### 7. Environment Variables

```bash
# Private key for signing (RS256)
WB_CTX_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Public key for verification (embedded in ctx)
WB_CTX_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Supabase credentials
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Context host
CTX_BASE_URL="https://ctx.yourdomain.nl"

# Shortlink domain
SHORTLINK_DOMAIN="https://wb.ai"
```

### 8. Key Generation

Generate RS256 key pair:
```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Convert to single-line for env vars
cat private.pem | tr '\n' '|' | sed 's/|/\\n/g'
cat public.pem | tr '\n' '|' | sed 's/|/\\n/g'
```

### 9. Integration Example

**HTML embed:**
```html
<a href="https://wb.ai/s/abc123" target="_blank">
  Edit in Builder
</a>
```

**React component:**
```jsx
function EditButton({ pageId, brandId }) {
  const [shortlink, setShortlink] = useState(null);

  async function generateLink() {
    const res = await fetch('/api/wbctx/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: brandId,
        type: 'page',
        page_id: pageId,
        ttl_minutes: 15,
        ephemeral: true
      })
    });
    const data = await res.json();
    setShortlink(data.shortlink);
  }

  return <button onClick={generateLink}>Edit Page</button>;
}
```

### 10. Defaults

- **TTL**: 10-15 minutes
- **Ephemeral**: `true` (single-use)
- **JWT Scopes**: Minimal (only specific page/news access)
- **Signature Algorithm**: RS256

## Benefits

✅ **Short URLs**: From 500+ chars to ~30 chars
✅ **Secure**: RS256 signatures prevent tampering
✅ **Time-limited**: Tokens expire automatically
✅ **Single-use**: Ephemeral tokens can't be reused
✅ **Scoped**: JWTs only access specific resources
✅ **Embeddable**: Easy to integrate in any app

## Next Steps

1. Deploy mint and serve endpoints
2. Generate RS256 key pair
3. Configure environment variables
4. Test with example shortlink
5. Monitor token usage and expiration
