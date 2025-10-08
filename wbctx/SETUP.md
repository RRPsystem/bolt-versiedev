# wbctx Setup Guide

## Prerequisites

- Supabase project with Edge Functions enabled
- OpenSSL installed for key generation
- Node.js/npm for deploying functions

## Step 1: Generate RS256 Key Pair

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# View private key (keep this secret!)
cat private.pem

# View public key (this goes in ctx JSON)
cat public.pem
```

## Step 2: Configure Environment Variables

Add these to your Supabase Edge Functions secrets:

```bash
# Set private key (for signing)
supabase secrets set WB_CTX_PRIVATE_KEY="$(cat private.pem | tr '\n' '|' | sed 's/|/\\n/g')"

# Set public key (for verification)
supabase secrets set WB_CTX_PUBLIC_KEY="$(cat public.pem | tr '\n' '|' | sed 's/|/\\n/g')"

# Set context base URL
supabase secrets set CTX_BASE_URL="https://ctx.ai-websitestudio.nl"
```

**Note:** The `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are already available in Edge Functions automatically.

## Step 3: Deploy Edge Functions

```bash
# Deploy mint endpoint
supabase functions deploy wbctx-mint

# Deploy serve endpoint
supabase functions deploy wbctx-serve

# Deploy redirect endpoint (for shortlinks)
supabase functions deploy wbctx-redirect
```

## Step 4: Test the Flow

### 4.1 Mint a Context Token

```bash
curl -X POST https://your-project.supabase.co/functions/v1/wbctx-mint \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "your-brand-uuid",
    "type": "page",
    "page_id": "your-page-uuid",
    "slug": "test-page",
    "ttl_minutes": 15,
    "ephemeral": true
  }'
```

Expected response:
```json
{
  "ctx_id": "abc123xy",
  "shortlink": "https://wb.ai/s/abc123xy",
  "ctx": { ...context object... },
  "expires_at": "2025-10-08T18:00:00Z"
}
```

### 4.2 Retrieve Context

```bash
curl https://your-project.supabase.co/functions/v1/wbctx-serve/abc123xy.json
```

### 4.3 Test Shortlink Redirect

Open in browser: `https://your-project.supabase.co/functions/v1/wbctx-redirect/abc123xy`

Should redirect to:
```
https://www.ai-websitestudio.nl/index.html?ctx=abc123xy&ctx_base=https://ctx.ai-websitestudio.nl&edge_badge=0#/mode/page
```

## Step 5: Frontend Integration

### React Example

```jsx
import { useState } from 'react';

function EditButton({ brandId, pageId, slug }) {
  const [shortlink, setShortlink] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateEditLink() {
    setLoading(true);
    try {
      const res = await fetch(
        'https://your-project.supabase.co/functions/v1/wbctx-mint',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            type: 'page',
            page_id: pageId,
            slug: slug,
            ttl_minutes: 15,
            ephemeral: true,
          }),
        }
      );
      const data = await res.json();
      setShortlink(data.shortlink);
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!shortlink ? (
        <button onClick={generateEditLink} disabled={loading}>
          {loading ? 'Generating...' : 'Edit in Builder'}
        </button>
      ) : (
        <a href={shortlink} target="_blank" rel="noopener">
          Open Builder
        </a>
      )}
    </div>
  );
}
```

### Plain JavaScript

```javascript
async function openBuilder(brandId, pageId, slug) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/wbctx-mint',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: brandId,
        type: 'page',
        page_id: pageId,
        slug: slug,
        ttl_minutes: 15,
        ephemeral: true,
      }),
    }
  );

  const data = await response.json();
  window.open(data.shortlink, '_blank');
}
```

## Step 6: Custom Domain (Optional)

To use `wb.ai/s/<id>` instead of the Supabase function URL:

1. **Add custom domain in Supabase:**
   - Go to Settings > API > Custom domains
   - Add `wb.ai` and verify DNS

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: wb.ai
   Value: your-project.supabase.co
   ```

3. **Update redirect function:**
   - The redirect function is already configured to handle this

## Security Checklist

- ✅ Private key stored securely in Supabase secrets (never in code)
- ✅ Public key embedded in ctx JSON for client verification
- ✅ Tokens are short-lived (10-15 minutes)
- ✅ Ephemeral tokens are single-use
- ✅ RLS policies restrict access to non-expired contexts
- ✅ JWT has minimal scopes (only specific page/news)
- ✅ RS256 signature prevents tampering

## Monitoring

### Check Active Contexts

```sql
SELECT
  id,
  expires_at,
  used,
  ephemeral,
  created_at,
  (ctx_data->>'brand_id') as brand_id
FROM wbctx_storage
WHERE expires_at > now()
ORDER BY created_at DESC;
```

### Cleanup Expired Contexts

```sql
SELECT cleanup_expired_wbctx();
```

### Monitor Usage

```sql
-- Count by date
SELECT
  date_trunc('day', created_at) as day,
  count(*) as contexts_created,
  sum(case when used then 1 else 0 end) as contexts_used
FROM wbctx_storage
GROUP BY day
ORDER BY day DESC;
```

## Troubleshooting

### "Keys not configured" Error

Make sure environment variables are set correctly:
```bash
supabase secrets list
```

### "Context not found or expired"

- Check if token has expired (check `expires_at`)
- If ephemeral, ensure it hasn't been used already

### "Invalid signature"

- Verify public key matches private key
- Ensure canonical JSON order is correct
- Check that all required fields are present

### Context Won't Load in Builder

1. Verify ctx_base URL is correct
2. Check browser console for CORS errors
3. Ensure wbctx-serve function is deployed
4. Test direct URL: `https://.../functions/v1/wbctx-serve/<id>.json`

## Next Steps

1. Deploy to production
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Integrate with your application
5. Test end-to-end flow

## Support

For issues or questions:
- Check function logs in Supabase dashboard
- Review database logs for storage errors
- Test each endpoint individually
