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

- Keep HTML/app shell revalidating (`max-age=0, must-revalidate`).
- Cache versioned static assets under `/assets/*` and `/_expo/static/*` with long-lived immutable caching.

`apps/mobile/vercel.json` should include:

```json
{
  "headers": [
    { "source": "/", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/_expo/static/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

## SPA rewrite safety
Use a rewrite that only targets extensionless app routes, so static files (audio/js/css/images) are never rewritten to `/`:

```json
{ "rewrites": [{ "source": "/((?!api/|.*\\..*).*)", "destination": "/" }] }
```

