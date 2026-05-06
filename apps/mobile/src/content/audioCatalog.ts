export type AudioId =
  | "persiapan_tidur"
  | "hening"
  | "rintik-hujan"
  | "ombak-laut"
  | "terima_diri"
  | "syukuri_hari";

type LegacyAudioId = "bersiap_tidur" | "afirmasi_tidur" | "meditasi_tidur";

export type AudioTrack = {
  id: AudioId;
  order: number;
  title: string;
  subtitle: string;
  durationSec: number;
  asset: number; // require(...)
  creator: string;
  category: string;
  contentType: "soundscape" | "guided-sleep" | "afirmasi";
  cover: number;
  thumbnail: number;
  isPremium: boolean;
};

export const AUDIO_TRACKS = [
  {
    id: "persiapan_tidur",
    order: 1,
    title: "Rilekskan Tubuh",
    subtitle: "Panduan pelan untuk melepas tegang",
    durationSec: 139,
    asset: require("../../assets/audio/sleep-guide/01-bersiap-tidur-2m19s.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "guided-sleep",
    cover: require("../../assets/image/cover/01-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "hening",
    order: 2,
    title: "Hening",
    subtitle: "Suasana lembut tanpa arahan",
    durationSec: 300,
    asset: require("../../assets/audio/soundscape/01-lapisan-sunyi-5m.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "soundscape",
    cover: require("../../assets/image/cover/02-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/02-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "rintik-hujan",
    order: 3,
    title: "Rintik Hujan",
    subtitle: "Suara hujan pelan untuk rebahan",
    durationSec: 300,
    asset: require("../../assets/audio/soundscape/02-dibawah-hujan-5m.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "soundscape",
    cover: require("../../assets/image/cover/03-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/03-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "ombak-laut",
    order: 4,
    title: "Ruang Senyap",
    subtitle: "Ambience lembut untuk menemani rebahan",
    durationSec: 300,
    asset: require("../../assets/audio/soundscape/03-larut-perlahan-5m.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "soundscape",
    cover: require("../../assets/image/cover/04-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/04-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "terima_diri",
    order: 5,
    title: "Terima Diri Hari Ini",
    subtitle: "Untuk malam ketika pikiran terasa berat",
    durationSec: 154,
    asset: require("../../assets/audio/afirmasi/01-menerima-diri-2m34s.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "afirmasi",
    cover: require("../../assets/image/cover/05-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/05-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "syukuri_hari",
    order: 6,
    title: "Syukuri Hari Ini",
    subtitle: "Menutup hari dengan rasa cukup",
    durationSec: 152,
    asset: require("../../assets/audio/afirmasi/02-rasa-syukur-2m32s.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "afirmasi",
    cover: require("../../assets/image/cover/06-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/06-master-thumbnail.jpg"),
    isPremium: false,
  },
] satisfies AudioTrack[];

const favoriteIds = new Set<AudioId>();

const legacyAudioIdAliases: Record<LegacyAudioId, AudioId> = {
  bersiap_tidur: "persiapan_tidur",
  afirmasi_tidur: "terima_diri",
  meditasi_tidur: "syukuri_hari",
};

export function normalizeAudioId(id: AudioId | LegacyAudioId): AudioId {
  if (id in legacyAudioIdAliases) {
    return legacyAudioIdAliases[id as LegacyAudioId];
  }

  return id as AudioId;
}

export function isFavorite(id: AudioId) {
  return favoriteIds.has(id);
}

export function toggleFavorite(id: AudioId) {
  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
    return false;
  }
  favoriteIds.add(id);
  return true;
}

export function getTrackById(id: AudioId | LegacyAudioId): AudioTrack {
  const normalizedId = normalizeAudioId(id);
  const t = AUDIO_TRACKS.find((x) => x.id === normalizedId);
  if (!t) throw new Error(`Unknown AudioId: ${id}`);
  return t;
}
