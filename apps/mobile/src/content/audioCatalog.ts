export type AudioId =
  | "napas-pelan"
  | "body-scan"
  | "pikiran-tenang"
  | "cerita-menenangkan"
  | "cerita-untuk-tidur";

export type AudioTrack = {
  id: AudioId;
  order: number;
  title: string;
  subtitle: string;
  durationSec: number;
  asset: number; // require(...)
  creator: string;
  category: "audio";
  tags: string[];
  cover: number;
  thumbnail: number;
  isPremium: boolean;
};

export const AUDIO_TRACKS = [
  {
    id: "napas-pelan",
    order: 1,
    title: "Napas Pelan",
    subtitle: "Tenang dalam 5 menit",
    durationSec: 5 * 60,
    asset: require("../../assets/audio/01-napas-pelan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/01-master.png"),
    thumbnail: require("../../assets/01-thumbnail.png"),
    isPremium: false,
  },
  {
    id: "body-scan",
    order: 2,
    title: "Body Scan",
    subtitle: "Lepaskan tegang perlahan",
    durationSec: 5 * 60,
    asset: require("../../assets/audio/02-body-scan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/01-master.png"),
    thumbnail: require("../../assets/01-thumbnail.png"),
    isPremium: false,
  },
  {
    id: "pikiran-tenang",
    order: 3,
    title: "Pikiran Tenang",
    subtitle: "Redakan ramai di kepala",
    durationSec: 5 * 60,
    asset: require("../../assets/audio/03-pikiran-tenang-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/01-master.png"),
    thumbnail: require("../../assets/01-thumbnail.png"),
    isPremium: false,
  },
  {
    id: "cerita-menenangkan",
    order: 4,
    title: "Cerita Menenangkan",
    subtitle: "Tidur ditemani cerita",
    durationSec: 5 * 60,
    asset: require("../../assets/audio/04-cerita-menenangkan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/01-master.png"),
    thumbnail: require("../../assets/01-thumbnail.png"),
    isPremium: false,
  },
  {
    id: "cerita-untuk-tidur",
    order: 5,
    title: "Cerita Untuk Tidur",
    subtitle: "Pikiran pulih jelang tidur",
    durationSec: 5 * 60,
    asset: require("../../assets/audio/05-cerita-untuk-tidur-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/01-master.png"),
    thumbnail: require("../../assets/01-thumbnail.png"),
    isPremium: false,
  },
] satisfies AudioTrack[];

export function getTrackById(id: AudioId): AudioTrack {
  const t = AUDIO_TRACKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown AudioId: ${id}`);
  return t;
}
