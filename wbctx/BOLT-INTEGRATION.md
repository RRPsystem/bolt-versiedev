# Integration Guide for Bolt Developers

## Quick Start

The wbctx (WebBuilder Context) system provides secure, short-lived URLs for embedding the website builder. Instead of passing long query parameters, you generate a single short context token.

## What You Need

### 1. Backend Integration (Node.js/TypeScript)

```typescript
import fetch from 'node-fetch';

interface ContextRequest {
  brand_id: string;
  type: 'page' | 'news';
  page_id?: string;
  slug?: string;
  news_slug?: string;
  ttl_minutes?: number;
  ephemeral?: boolean;
}

async function mintBuilderContext(params: ContextRequest) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/wbctx-mint',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ttl_minutes: 15,
        ephemeral: true,
        ...params,
      }),
    }
  );

  const data = await response.json();
  return data.shortlink; // https://wb.ai/s/<id>
}

// Usage
const editLink = await mintBuilderContext({
  brand_id: 'brand-uuid',
  type: 'page',
  page_id: 'page-uuid',
  slug: 'about-us',
});

// editLink: https://wb.ai/s/abc123xy
```

### 2. Frontend Integration (React)

```tsx
import { useState } from 'react';

interface EditButtonProps {
  brandId: string;
  pageId: string;
  slug: string;
}

export function EditButton({ brandId, pageId, slug }: EditButtonProps) {
  const [loading, setLoading] = useState(false);

  async function openBuilder() {
    setLoading(true);
    try {
      const res = await fetch('/api/wbctx/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          type: 'page',
          page_id: pageId,
          slug: slug,
        }),
      });

      const { shortlink } = await res.json();
      window.open(shortlink, '_blank');
    } catch (error) {
      console.error('Failed to open builder:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={openBuilder} disabled={loading}>
      {loading ? 'Loading...' : 'Edit in Builder'}
    </button>
  );
}
```

### 3. Plain HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Edit Page</title>
</head>
<body>
  <button onclick="openBuilder()">Edit Page</button>

  <script>
    async function openBuilder() {
      const response = await fetch('https://your-api.com/mint-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: 'brand-uuid',
          type: 'page',
          page_id: 'page-uuid',
          slug: 'home',
        }),
      });

      const { shortlink } = await response.json();
      window.open(shortlink, '_blank');
    }
  </script>
</body>
</html>
```

## API Reference

### POST /functions/v1/wbctx-mint

Generates a new context token and shortlink.

**Request Body:**
```json
{
  "brand_id": "uuid",
  "type": "page" | "news",
  "page_id": "uuid",
  "slug": "page-slug",
  "news_slug": "news-slug",
  "ttl_minutes": 15,
  "ephemeral": true
}
```

**Response:**
```json
{
  "ctx_id": "abc123xy",
  "shortlink": "https://wb.ai/s/abc123xy",
  "ctx": {
    "api": "https://...",
    "token": "eyJhbGc...",
    "apikey": "eyJhbGc...",
    "brand_id": "uuid",
    "page_id": "uuid",
    "news_slug": null,
    "slug": "page-slug",
    "exp": 1733671200,
    "ephemeral": true,
    "sig": "signature...",
    "pub": "-----BEGIN PUBLIC KEY-----..."
  },
  "expires_at": "2025-10-08T18:00:00Z"
}
```

### GET /functions/v1/wbctx-serve/{id}.json

Retrieves context data by ID. Used internally by the builder.

**Response:**
```json
{
  "api": "https://...",
  "token": "eyJhbGc...",
  ...
}
```

### GET /functions/v1/wbctx-redirect/{id}

Redirects to the builder with context. This is what `wb.ai/s/<id>` points to.

**Redirects to:**
```
https://www.ai-websitestudio.nl/index.html?ctx=<id>&ctx_base=https://ctx.ai-websitestudio.nl&edge_badge=0#/mode/page
```

## Configuration

### Environment Variables

These are set in Supabase Edge Functions:

```bash
WB_CTX_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WB_CTX_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
CTX_BASE_URL="https://ctx.ai-websitestudio.nl"
```

### Default Values

- **TTL**: 15 minutes (configurable 5-60 minutes)
- **Ephemeral**: true (single-use tokens)
- **Type**: 'page' or 'news'

## Security Features

✅ **Short-lived tokens** - Auto-expire after 15 minutes
✅ **Single-use** - Ephemeral tokens can't be reused
✅ **RS256 signatures** - Prevents tampering
✅ **Scoped JWTs** - Only access specific page/news
✅ **No credentials in URLs** - Credentials loaded from secure context

## Common Use Cases

### 1. CMS Integration

```typescript
// In your CMS admin panel
function getEditButton(page: Page) {
  return `
    <a href="#" onclick="editPage('${page.id}', '${page.slug}')">
      Edit Page
    </a>
  `;
}

async function editPage(pageId: string, slug: string) {
  const link = await mintBuilderContext({
    brand_id: currentBrand.id,
    type: 'page',
    page_id: pageId,
    slug: slug,
  });
  window.open(link, '_blank');
}
```

### 2. Email Links

```typescript
// Generate temporary edit link for email
const editLink = await mintBuilderContext({
  brand_id: brand.id,
  type: 'page',
  page_id: page.id,
  slug: page.slug,
  ttl_minutes: 60, // 1 hour for email
  ephemeral: false, // Allow multiple uses
});

await sendEmail({
  to: editor.email,
  subject: 'Edit your page',
  body: `Click here to edit: ${editLink}`,
});
```

### 3. API Integration

```typescript
// Your API endpoint
app.post('/api/pages/:id/edit-link', async (req, res) => {
  const page = await db.pages.findById(req.params.id);

  const link = await mintBuilderContext({
    brand_id: page.brand_id,
    type: 'page',
    page_id: page.id,
    slug: page.slug,
  });

  res.json({ link });
});
```

## Error Handling

```typescript
try {
  const link = await mintBuilderContext(params);
  window.open(link, '_blank');
} catch (error) {
  if (error.status === 400) {
    console.error('Invalid parameters:', error.message);
  } else if (error.status === 500) {
    console.error('Server error, try again later');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Testing

### Test Token Generation

```bash
curl -X POST https://your-project.supabase.co/functions/v1/wbctx-mint \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "test-brand-uuid",
    "type": "page",
    "page_id": "test-page-uuid",
    "slug": "test-page"
  }'
```

### Test Shortlink

1. Copy `shortlink` from response
2. Open in browser
3. Should redirect to builder with context loaded

## Migration from Long URLs

**Before:**
```
https://www.ai-websitestudio.nl/index.html?brand_id=xxx&page_id=xxx&slug=xxx&token=eyJhbGc...&apikey=eyJhbGc...&api=https://...#/mode/page
```

**After:**
```
https://wb.ai/s/abc123xy
```

Benefits:
- 90% shorter URLs
- More secure (no credentials in URL)
- Time-limited access
- Easier to share and embed

## Next Steps

1. Review `wbctx/README.md` for detailed architecture
2. Check `wbctx/SETUP.md` for deployment instructions
3. Test with example in `wbctx/bolt1.json`
4. Integrate into your application
5. Monitor usage in Supabase dashboard

## Support

- Documentation: `wbctx/README.md`
- Setup guide: `wbctx/SETUP.md`
- Example: `wbctx/bolt1.json`
