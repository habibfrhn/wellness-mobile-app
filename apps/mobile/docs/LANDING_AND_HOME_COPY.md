# Landing and home screen copy

Use this document as the maintenance reference for the current Lumepo landing page and home screen wording. User-visible app copy should continue to live in `apps/mobile/src/i18n/strings.ts` when it is shared through the string table, while audio-card titles and descriptions live in `apps/mobile/src/content/audioCatalog.ts`.

## Implementation map

- Landing page structure lives in `apps/mobile/src/screens/LandingScreen.web.tsx`.
- Landing hero H1 and subheadline live in `apps/mobile/src/i18n/strings.ts` under `id.landing.heroTitle` and `id.landing.heroSubtitle` because the hero title is also used as image alt text.
- Landing body and CTA wording currently live inline in `LandingScreen.web.tsx`, matching the existing landing-screen pattern.
- Landing meta descriptions in `apps/mobile/App.tsx`, `apps/mobile/src/web/LandingEntry.web.tsx`, and `apps/mobile/index.html` mirror the landing subheadline for browser and share previews.
- Home greeting and section titles live in `apps/mobile/src/i18n/strings.ts` under `id.home.*`.
- Home audio-card titles and descriptions live in `apps/mobile/src/content/audioCatalog.ts`; keep existing track IDs, ordering, assets, and `contentType` values unless a separate catalog/route migration requires changing them.

## Maintenance checklist

1. Keep copy-only updates separate from layout, navigation, analytics, or audio-asset changes.
2. Remove unused string-table entries when copy is deleted, but verify with `rg` before removing a key.
3. Keep this document in sync with the rendered landing/home wording whenever either screen's copy changes.
4. Re-run `pnpm typecheck`, `pnpm lint`, and a web export or browser smoke test after copy changes that touch TypeScript or web entry files.

## Landing page

### Hero section

- H1: Masuk waktu tidur dengan lebih tenang
- Subheadline: Lumepo menemani kamu masuk ke suasana tidur dengan rutinitas malam yang tenang dan tidak bikin kepala makin ramai.
- Primary CTA button: Mulai malam ini
- Small note under CTA: Gratis selama beta

### Second section

- H2: Satu langkah kecil sebelum tidur
- Body: Saat sudah lelah, kamu tidak butuh banyak pilihan. Cukup pilih suasana yang kamu butuhkan malam ini, tekan mulai, lalu biarkan tubuh dan pikiran pelan-pelan melambat.

### Third section

- H2: Dibuat untuk malam yang tenang
- Body: Tidak ada feed, video, atau banyak menu yang bikin terdistraksi. Lumepo dibuat supaya kamu bisa langsung masuk ke rutinitas tidur tanpa perlu berpikir panjang.

### Fourth section

- H2: Tidak perlu sempurna
- Body: Kamu tidak harus langsung tertidur. Tidak harus fokus penuh. Cukup rebahan, dengarkan dengan santai, dan beri tubuhmu tanda bahwa hari ini sudah selesai.

### Final CTA section

- H2: Coba satu rutinitas malam ini
- Body: Mulai dari beberapa menit sebelum tidur dan lihat apakah malam terasa sedikit lebih tenang.
- CTA button: Coba Lumepo

## Home screen

### Main greeting

- Text: Selamat malam, [user name]
- Subtitle: Pilih satu hal kecil untuk menemani malam ini.

### First content section

- Title: Untuk menutup hari

#### Audio card 1

- Title: Rilekskan Tubuh
- Description: Panduan pelan untuk melepas tegang

#### Audio card 2

- Title: Terima Diri Hari Ini
- Description: Untuk malam ketika pikiran terasa berat

#### Audio card 3

- Title: Syukuri Hari Ini
- Description: Menutup hari dengan rasa cukup

### Second content section

- Title: Suasana tenang

#### Audio card 1

- Title: Hening
- Description: Suasana lembut tanpa arahan

#### Audio card 2

- Title: Rintik Hujan
- Description: Suara hujan pelan untuk rebahan

#### Audio card 3

- Title: Ruang Senyap
- Description: Ambience lembut untuk menemani rebahan
