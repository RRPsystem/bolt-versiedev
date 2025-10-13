# Template System Debug Guide voor BOLT Builder

## Probleem: "Invalid JWT" bij opslaan

De builder krijgt een 401 error met message "Invalid JWT" wanneer een template wordt opgeslagen.

## Root Cause

De JWT die in de URL parameter `token` wordt meegegeven, moet EXACT worden gebruikt in de Authorization header bij het aanroepen van de pages-api.

## ✅ CORRECTE Implementatie

### 1. Lees het JWT token uit URL parameters

```javascript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');  // Dit JWT moet gebruikt worden!
const api = urlParams.get('api');
const apikey = urlParams.get('apikey');
```

### 2. Gebruik het token in ALLE API calls

```javascript
// ❌ FOUT - Gebruik NIET de apikey als Bearer token
const response = await fetch(`${api}/functions/v1/pages-api/save`, {
  headers: {
    'Authorization': `Bearer ${apikey}`,  // ❌ FOUT!
    'Content-Type': 'application/json'
  }
});

// ✅ CORRECT - Gebruik het token parameter
const response = await fetch(`${api}/functions/v1/pages-api/save`, {
  headers: {
    'Authorization': `Bearer ${token}`,  // ✅ CORRECT!
    'Content-Type': 'application/json'
  }
});
```

### 3. Voeg apikey alleen toe als query parameter (optioneel)

```javascript
// De apikey kan als query parameter worden toegevoegd, maar is niet verplicht
const url = `${api}/functions/v1/pages-api/save?apikey=${apikey}`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // Token in Authorization header
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_template: true,
    template_category: 'home',
    title: 'Test',
    slug: 'test',
    content_json: { ... }
  })
});
```

## Verificatie Checklist

### Voor BOLT Team:

1. ✅ **Check dat je het juiste token gebruikt:**
   ```javascript
   console.log('[DEBUG] Token used:', token.substring(0, 20) + '...');
   console.log('[DEBUG] Token from URL:', urlParams.get('token').substring(0, 20) + '...');
   // Deze moeten IDENTIEK zijn!
   ```

2. ✅ **Check de Authorization header:**
   ```javascript
   console.log('[DEBUG] Auth header:', headers['Authorization']);
   // Moet zijn: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJic..."
   ```

3. ✅ **Check de request body:**
   ```javascript
   console.log('[DEBUG] Request body:', JSON.stringify({
     is_template: true,
     template_category: category,
     title: title,
     slug: slug,
     content_json: contentJson
   }, null, 2));
   ```

4. ✅ **Test met curl:**
   ```bash
   curl -X POST \
     'https://huaaogdxxdcakxryecnw.supabase.co/functions/v1/pages-api/save' \
     -H 'Authorization: Bearer <TOKEN_FROM_URL>' \
     -H 'Content-Type: application/json' \
     -d '{
       "is_template": true,
       "template_category": "home",
       "title": "Test Template",
       "slug": "test-template",
       "content_json": {
         "layout": [],
         "htmlSnapshot": "<div>test</div>"
       }
     }'
   ```

## Common Pitfalls

### ❌ FOUT 1: Verkeerde token gebruiken

```javascript
// Fout: apikey gebruiken als Bearer token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

### ✅ CORRECT 1: URL token parameter gebruiken

```javascript
// Correct: token parameter uit URL gebruiken
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJicmFuZF9pZCI6IjAwMDAwMDAwLTAwMDAuLi4...
```

### ❌ FOUT 2: JWT zelf genereren

```javascript
// Fout: Eigen JWT maken in de builder
const myJWT = generateJWT({ brand_id: '...', ... });
```

### ✅ CORRECT 2: Meegegeven JWT gebruiken

```javascript
// Correct: JWT uit URL parameter gebruiken
const token = urlParams.get('token');
```

### ❌ FOUT 3: brand_id meesturen voor templates

```javascript
// Fout: brand_id meesturen
{
  brand_id: '12345',  // ❌ NOOIT meesturen voor templates!
  is_template: true,
  ...
}
```

### ✅ CORRECT 3: Geen brand_id voor templates

```javascript
// Correct: Geen brand_id
{
  is_template: true,
  template_category: 'home',
  title: 'Test',
  slug: 'test',
  content_json: { ... }
}
```

## Expected JWT Structure

Het JWT dat in de URL parameter `token` wordt meegegeven heeft deze structuur:

```json
{
  "brand_id": "00000000-0000-0000-0000-000000000000",
  "sub": "324acef5-a7dd-4f4b-8c8c-43f223d62a07",
  "scope": ["pages:write", "content:write", "layouts:write", "menus:write"],
  "is_template": true,
  "exp": 1760448566,
  "iat": 1760362166
}
```

Key points:
- `brand_id` is een nul-UUID voor templates
- `is_template: true` geeft aan dat dit een template operatie is
- `scope` bevat de benodigde permissions
- `exp` en `iat` voor token expiry

## Test Commands

### 1. Decode het JWT (zonder verificatie)

```javascript
// In browser console
const token = new URLSearchParams(window.location.search).get('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
```

Expected output:
```json
{
  "brand_id": "00000000-0000-0000-0000-000000000000",
  "sub": "...",
  "scope": ["pages:write", "content:write", ...],
  "is_template": true,
  "exp": ...,
  "iat": ...
}
```

### 2. Test API call in browser console

```javascript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const api = urlParams.get('api');

fetch(`${api}/functions/v1/pages-api/save`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_template: true,
    template_category: 'home',
    title: 'Console Test',
    slug: 'console-test',
    content_json: {
      layout: [],
      htmlSnapshot: '<div>test</div>'
    }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Expected result (200 OK):
```json
{
  "page_id": "uuid...",
  "title": "Console Test",
  "slug": "console-test",
  "is_template": true,
  "template_category": "home",
  "content_json": {...},
  "status": "draft"
}
```

## Contact

Als dit nog steeds niet werkt na deze fixes, stuur dan:

1. De **volledige error response** (headers + body)
2. De **JWT payload** (gedecoded, zie test command 1)
3. De **exacte request** die wordt gestuurd (headers + body)
4. Screenshots van de Network tab in DevTools

Dit helpt ons om het probleem sneller te identificeren!
