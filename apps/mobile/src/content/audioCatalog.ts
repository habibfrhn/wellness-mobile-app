export type AudioId = "bersiap-tidur" | "lapisan-sunyi" | "nada-menenangkan" | "larut-perlahan";

export type AudioTrack = {
  id: AudioId;
  order: number;
  title: string;
  subtitle: string;
  durationSec: number;
  asset: number; // require(...)
  creator: string;
  category: string;
  tags: string[];
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
    durationSec: 600.033,
    asset: require("../../assets/audio/sleep-guide/01-bersiap-tidur-10m.m4a"),
    creator: "Lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/cover/01-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "lapisan-sunyi",
    order: 6,
    title: "Sunyi Lembut",
    subtitle: "Nada tenang untuk hening",
    durationSec: 580.085,
    asset: require("../../assets/audio/soundscape/01-lapisan-sunyi-10m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["soundscape"],
    cover: require("../../assets/image/cover/06-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/06-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "nada-menenangkan",
    order: 7,
    title: "Nada Rileks",
    subtitle: "Ritme lembut untuk rileks",
    durationSec: 600.033,
    asset: require("../../assets/audio/soundscape/02-nada-menenangkan-10m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["soundscape"],
    cover: require("../../assets/image/cover/07-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/07-master-thumbnail.jpg"),
    isPremium: false,
  },
  {
    id: "larut-perlahan",
    order: 8,
    title: "Larut Malam",
    subtitle: "Hening bertahap untuk tidur",
    durationSec: 600.033,
    asset: require("../../assets/audio/soundscape/03-larut-perlahan-10m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["soundscape"],
    cover: require("../../assets/image/cover/08-master-cover.jpg"),
    thumbnail: require("../../assets/image/thumbnail/08-master-thumbnail.jpg"),
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
