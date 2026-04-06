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
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

## Audio cache headers (recommended)
To minimize repeated audio bandwidth usage, keep long-lived cache headers for audio assets in `apps/mobile/vercel.json`:

```json
{
  "source": "/assets/(.*)\\.(m4a|mp3|aac|wav|ogg|webm)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

Apply this **before deployment** so every new deploy immediately serves audio with CDN/browser caching.

