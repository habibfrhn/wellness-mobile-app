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

## Auth reset-password setup

Before release, complete reset-password operational setup and E2E validation in:

- `apps/mobile/docs/RESET_PASSWORD_SETUP.md`

## Expected output
Expo static export output directory:

- `apps/mobile/dist`

## Vercel settings
Set the project configuration in Vercel to:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`
- **Ignored Build Step**: keep the repo `ignoreCommand` in `apps/mobile/vercel.json` enabled so markdown/docs-only commits do not trigger preview builds.

## Usage guardrails (recommended)
- **Vercel**
  - Add budget alerts for bandwidth and function invocations in Vercel usage settings.
  - Disable Web Analytics / Speed Insights unless you are actively using them for a decision window.
  - Keep preview deployments, but pair with ignored-build rules to avoid waste on non-product changes.
- **Supabase**
  - Set project spend cap and alerts for egress, database size, and function invocations.
  - Monitor `analytics_events` growth and prune/archive raw rows older than your MVP analysis window.
  - Keep Realtime disabled for tables that are not subscribed by clients.

## SPA rewrite reminder
Keep `apps/mobile/vercel.json` rewrite enabled so client-side routes work after deploy:

```json
{ "rewrites": [{ "source": "/((?!api/|.*\..*).*)", "destination": "/" }] }
```

## Cache policy baseline (recommended)
For safe SPA updates + low bandwidth usage:

- Keep HTML/app shell and SPA document routes conservative (`max-age=0, must-revalidate`) so new deploys are picked up quickly.
- Cache fingerprinted Expo build assets under `/assets/*` and `/_expo/static/*` with long-lived immutable caching.
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
    { "source": "/_expo/static/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

## MVP cache matrix (what is cached vs not cached)

### Cached (intentional)
- **Expo hashed static build artifacts** (`/assets/*`, `/_expo/static/*`):
  - Where: CDN + browser HTTP cache.
  - TTL/strategy: `public, max-age=31536000, immutable`.
  - Why: safe repeat-visit performance because filenames are content-hashed at build export time.
- **Night streak progress cache entry** (`night:streak_progress_cache:<userId>`):
  - Where: app storage (`AsyncStorage`, and web storage adapter on web).
  - TTL/strategy: fresh for 5 minutes; stale fallback allowed only when fetch fails.
  - Why: quick UX while limiting stale progress risk.

### Not cached (intentional)
- **HTML/app shell + SPA documents** (`/`, `/index.html`, extensionless routes):
  - strategy: `max-age=0, must-revalidate`.
- **`/api/*` responses**:
  - strategy: `private, no-store, max-age=0`.
- **Admin analytics / user progress API payloads / auth responses**:
  - no app-level query cache configured; data is fetched directly from Supabase RPC/functions.
- **Offline/PWA cache layers**:
  - no service worker precache strategy and no custom Cache Storage layer.

## Audio caching note (MVP)
- Audio files in the catalog are bundled static assets and emitted as hashed files in `dist/assets/...*.m4a` during web export.
- These files are cached by normal browser/CDN HTTP caching via `/assets/*` immutable headers.
- We intentionally avoid service-worker/offline audio caching for MVP.
- Web player uses `audio.preload = "metadata"` to avoid fetching full large audio files too early.

## SPA rewrite safety
Use a rewrite that only targets extensionless app routes, so static files (audio/js/css/images) are never rewritten to `/`:

```json
{ "rewrites": [{ "source": "/((?!api/|.*\\..*).*)", "destination": "/" }] }
```
