# Release Checklist (MVP)

## Build sanity
- [ ] `pnpm -C apps/mobile start -c` works
- [ ] Android preview build installs and opens without Metro
- [ ] No red screens on cold start

## Auth
- [ ] Sign up -> Verify Email -> link opens app -> logged in
- [ ] Log out works
- [ ] Delete account works (user removed from Supabase Auth)

## Audio playback
- [ ] No autoplay on any screen
- [ ] Play/Pause works
- [ ] Seek bar works
- [ ] Resume progress works (leave Player -> return -> continues)
- [ ] Progress clears when finished

## UI/UX
- [ ] Home scroll works (no cropped content)
- [ ] Android nav bar not overlaying content (safe area / padding ok)
- [ ] Strings all Indonesian (no “Play tonight”, etc.)

## EAS env
- [ ] EXPO_PUBLIC_SUPABASE_URL present in preview/prod
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY present in preview/prod
