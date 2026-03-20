export type AudioId =
  | "bersiap_tidur"
  | "hening"
  | "rintik-hujan"
  | "ombak-laut"
  | "afirmasi_tidur"
  | "meditasi_tidur";

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
    id: "bersiap_tidur",
    order: 1,
    title: "Rilekskan Tubuh",
    subtitle: "Ritual santai sebelum lelap",
    durationSec: 600,
    asset: require("../../assets/audio/sleep-guide/01-bersiap-tidur-10m.m4a"),
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
    subtitle: "Suara latar lembut",
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
    subtitle: "Rintik pelan menemani",
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
    title: "Ombak Laut",
    subtitle: "Irama ombak perlahan",
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
    id: "afirmasi_tidur",
    order: 5,
    title: "Terima Diri",
    subtitle: "Afirmasi lembut untuk diri",
    durationSec: 166,
    asset: require("../../assets/audio/afirmasi/01-menerima-diri-2m46s.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "afirmasi",
    cover: require("../../assets/image/cover/05-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/05-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "meditasi_tidur",
    order: 6,
    title: "Syukuri Hari",
    subtitle: "Afirmasi lembut untuk diri",
    durationSec: 166,
    asset: require("../../assets/audio/afirmasi/02-rasa-syukur-2m46s.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "afirmasi",
    cover: require("../../assets/image/cover/06-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/06-master-thumbnail.jpg"),
    isPremium: false,
  },
] satisfies AudioTrack[];

const favoriteIds = new Set<AudioId>();

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

export function getTrackById(id: AudioId): AudioTrack {
  const t = AUDIO_TRACKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown AudioId: ${id}`);
  return t;
}
