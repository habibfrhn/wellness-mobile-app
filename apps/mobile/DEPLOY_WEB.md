# Deploy Web (Expo)

## Export static web build
From repository root:

```bash
pnpm -C apps/mobile export:web
```

Or using workspace script:

```bash
pnpm --filter mobile export:web
```

## Expected output
Expo static export output directory:

- `apps/mobile/dist`

## Vercel settings
Set the project configuration in Vercel to:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`

## SPA rewrite reminder
Keep `apps/mobile/vercel.json` rewrite enabled so client-side routes work after deploy:

```json
{ "rewrites": [{ "source": "/((?!api/|.*\..*).*)", "destination": "/" }] }
```

## Cache policy baseline (recommended)
For safe SPA updates + low bandwidth usage:

- Keep HTML/app shell and SPA document routes conservative (`max-age=0, must-revalidate`) so new deploys are picked up quickly.
- Cache versioned static assets under `/assets/*`, `/_expo/static/*`, and static file extensions (JS/CSS/fonts/images) with long-lived immutable caching.
- Keep `/api/*` responses uncacheable (`private, no-store`) to avoid stale or user-specific data leaks.

`apps/mobile/vercel.json` should include:

```json
{
  "headers": [
    { "source": "/", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/((?!api/|.*\\..*).*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "private, no-store, max-age=0" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/_expo/static/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*\\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot))", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

## SPA rewrite safety
Use a rewrite that only targets extensionless app routes, so static files (audio/js/css/images) are never rewritten to `/`:

```json
{ "rewrites": [{ "source": "/((?!api/|.*\\..*).*)", "destination": "/" }] }
```

