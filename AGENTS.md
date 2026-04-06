# Agent Playbook (Lumepo / wellness-mobile-app)

Use this guide for safe, MVP-aligned contributions.

## 1) Project context
- Product: sleep-focused wellness MVP with auth-gated audio experience, nightly check-in/check-out flow, and admin analytics.
- Primary app: `apps/mobile` (Expo + React Native + web target).
- Backend dependencies: Supabase Auth, Postgres migrations/RPCs, Edge Functions in `supabase/functions`.

## 2) Architecture map
- App bootstrap/routing: `apps/mobile/App.tsx`
- Navigation: `apps/mobile/src/navigation/*`
- Screens: `apps/mobile/src/screens/*`
- Reusable UI: `apps/mobile/src/components/*`
- Business/services layer: `apps/mobile/src/services/*`
- Strings: `apps/mobile/src/i18n/strings.ts`
- Design tokens: `apps/mobile/src/theme/tokens.ts`
- Supabase SQL and policies: `supabase/migrations/*`
- Edge functions: `supabase/functions/*`

## 3) Core guardrails (do not break)
- Preserve auth/session flow and deep-link reset/callback handling.
- Keep admin access server-enforced (RLS/RPC-based), not UI-only.
- Do not expose secrets or service-role credentials in client code.
- Keep event tracking schema consistent with edge/database validation.
- Do not change native iOS/Android behavior when making web-only responsiveness updates.

## 4) Code quality rules
- Keep screens thin; move reusable visuals to components and logic to hooks/services.
- Target screen files under ~400 lines (prefer ~300).
- Remove dead code/state/imports while touching related areas.
- Avoid drive-by refactors outside task scope.
- Never add try/catch around imports.

## 5) UI consistency rules
- Prefer `strings.ts` for user-visible copy.
- Prefer `tokens.ts` for colors/spacing/radius/typography.
- If adding tokens, use top-level exports and update all consumers in same change.
- For web responsiveness, use viewport width utilities (`useViewportWidth`, `constants/webLayout`) and `.web.tsx` wrappers.
- Do not use user-agent detection for layout.

## 6) Auth / admin / analytics specifics

### Auth
- Keep Supabase auth behavior centralized in services (`supabase.ts`, `authLinks.ts`, `webAuth.ts`, `authOAuth.ts`).
- Maintain verification gating (`email_confirmed_at`) and reset-link flows.

### Admin
- Admin route is web-only (`/admin` patterns handled in `App.tsx`).
- Keep admin dashboard dependent on backend `is_admin()` and admin RPCs.
- Never bypass backend admin checks in client code.

### Analytics
- Client tracking in `src/services/analytics.ts`.
- Ingestion constraints/rate limiting in `supabase/functions/track-analytics-event` + SQL constraints.
- If event schema changes, update client + function + SQL constraints/RPC consumers together.

## 7) Backend/security rules
- Edge functions must validate method, auth, payload, and rate limits.
- Keep CORS and origin handling explicit for browser-invoked functions.
- Do not leak raw internal errors to end users.
- Preserve/strengthen RLS and privilege boundaries in migrations.

## 8) Audio catalog defaults
When adding new audio entries in `src/content/audioCatalog.ts`:
- `creator`: use `Lumepo` unless task says otherwise.
- Match cover + thumbnail numbers.
- `durationSec`: actual duration.
- `.m4a` content defaults to category `audio` unless specified.
- `title` may follow file name.

## 9) Deployment-related changes
- Web deploy config: `apps/mobile/vercel.json` + `apps/mobile/DEPLOY_WEB.md`
- Mobile release docs: `apps/mobile/docs/RELEASE_CHECKLIST.md` and store checklist.
- Keep README and SECURITY_AUDIT in sync when changing architecture/security/deploy behavior.

## 10) Validation workflow
Before finishing:
1. Review nearby patterns and reuse existing conventions.
2. Run relevant checks (`pnpm typecheck`, `pnpm lint`, targeted checks).
3. If checks fail for pre-existing reasons, state that clearly.
4. For visible web UI changes, capture a screenshot when tooling allows.
5. Stage only intended files (`git status`, `git diff --staged`).
