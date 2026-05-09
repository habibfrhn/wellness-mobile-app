# Home screen web UI maintenance

The web home screen is implemented in `apps/mobile/src/screens/App/HomeScreen.web.tsx` and composes reusable UI from `apps/mobile/src/components/*`. Keep the screen focused on layout orchestration and route/event handling; put reusable card visuals and interactions inside component files.

## Current structure

- `HomeScreen.web.tsx` owns page width, safe-area spacing, responsive section gaps, the Sebelum Tidur modal state, scroll-to-audio behavior, the desktop two-column audio layout, and audio navigation/tracking.
- `BedtimePauseCard.web.tsx` owns the homescreen “Sebelum Tidur” card. Its secondary CTA should scroll/focus users to the existing audio sections without hiding or replacing audio lists.
- `BedtimePauseFlowModal.web.tsx` owns the short Home → Check-in → Pause instruction → End flow. Keep it non-audio-dependent: one check-in step, one pause instruction step selected from the chosen option, and one end screen.
- `AudioTrackListSection` owns the section title and track-list spacing; `AudioTrackCard` owns individual audio-card visuals.
- `HomeFeedbackSection.web.tsx` owns the “Bantu kami berkembang” card content, border, rounded corners, shadow, and external feedback-link CTA.
- Home greeting, Sebelum Tidur, section-title, and feedback-card copy lives in `apps/mobile/src/i18n/strings.ts` under `id.home.*`.
- Home audio-card titles and descriptions come from `apps/mobile/src/content/audioCatalog.ts`; the rendered grouping is controlled by each track's `contentType` (`soundscape` vs non-soundscape).
- The canonical copy reference for the landing page and home screen is `apps/mobile/docs/LANDING_AND_HOME_COPY.md`.

## Sebelum Tidur flow guidance

- Keep the card above both current audio sections. The feature is a bedtime pause/check-in flow, not an audio recommendation surface.
- Preserve both CTAs: “Mulai” opens the modal flow, while “Langsung pilih audio” scrolls to the existing audio sections.
- Do not add text input, timers, audio-selection logic, or extra steps unless product requirements change.
- The optional breathing circle is decorative and must not gate progress; users can continue, skip, finish, or close the flow at any time.
- If the selected-option copy changes, update `BedtimePauseFlowModal.web.tsx`, `apps/mobile/src/i18n/strings.ts`, and `apps/mobile/docs/LANDING_AND_HOME_COPY.md` together.

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
