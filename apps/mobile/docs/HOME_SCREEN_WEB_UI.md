# Home screen web UI maintenance

The web home screen is implemented in `apps/mobile/src/screens/App/HomeScreen.web.tsx` and composes reusable UI from `apps/mobile/src/components/*`. Keep the screen focused on layout orchestration and route/event handling; put reusable card visuals and interactions inside component files.

## Current structure

- `HomeScreen.web.tsx` owns page width, safe-area spacing, responsive section gaps, the desktop two-column audio layout, and audio navigation/tracking.
- `AudioTrackListSection` owns the section title and track-list spacing; `AudioTrackCard` owns individual audio-card visuals.
- `HomeFeedbackSection.web.tsx` owns the “Bantu kami berkembang” card content, border, rounded corners, shadow, and external feedback-link CTA.
- User-visible feedback-card copy lives in `apps/mobile/src/i18n/strings.ts` under `id.home.*`.

## Feedback card styling guidance

- Keep the outer home-screen feedback wrapper visual-free. It should only apply the shared horizontal section inset (`WEB_SECTION_CONTENT_INSET`) so the feedback card aligns with the audio cards.
- Keep the feedback card background, border, radius, and shadow on `HomeFeedbackSection.web.tsx`'s card container. This prevents a larger padded wrapper from drawing a second/offset shadow behind the visible card.
- Use design tokens from `apps/mobile/src/theme/tokens.ts` for colors, spacing, radius, and typography.
- If a shadow token is added later, update the feedback card and audio cards together so elevation remains visually consistent.

## Responsive maintenance checklist

When changing the home screen web layout:

1. Reuse `useViewportWidth`, `getWebViewport`, `getWebSectionSpacing`, and `getWebPageContainerStyle`; do not use user-agent detection for layout.
2. Keep native iOS/Android behavior unchanged by making web-specific layout changes in `.web.tsx` files when possible.
3. Avoid empty styles or wrapper-only visual effects that can drift from the rendered component bounds.
4. Re-run `pnpm typecheck`, `pnpm lint`, and a web export or browser smoke test.
5. For visible UI changes, capture a before/after screenshot whenever browser tooling is available.
