export type AudioId = "bersiap-tidur" | "lapisan-sunyi" | "dibawah-hujan" | "larut-perlahan";

export type AudioTrack = {
  id: AudioId;
  order: number;
  title: string;
  subtitle: string;
  durationSec: number;
  asset: number; // require(...)
  creator: string;
  category: string;
  contentType: "soundscape" | "guided-sleep";
  cover: number;
  thumbnail: number;
  isPremium: boolean;
};

export const AUDIO_TRACKS = [
  {
    id: "bersiap-tidur",
    order: 1,
    title: "Bersiap Tidur",
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
    id: "lapisan-sunyi",
    order: 2,
    title: "Sunyi Lembut",
    subtitle: "Nada tenang untuk hening",
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
    id: "dibawah-hujan",
    order: 3,
    title: "Di Bawah Hujan",
    subtitle: "Desau lembut menemani",
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
    id: "larut-perlahan",
    order: 4,
    title: "Larut Perlahan",
    subtitle: "Hening bertahap untuk tidur",
    durationSec: 300,
    asset: require("../../assets/audio/soundscape/03-larut-perlahan-5m.m4a"),
    creator: "Lumepo",
    category: "audio",
    contentType: "soundscape",
    cover: require("../../assets/image/cover/04-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/04-master-thumbnail.jpg"),
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
