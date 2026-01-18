export type AudioId =
  | "napas-pelan"
  | "body-scan"
  | "pikiran-tenang"
  | "cerita-menenangkan"
  | "cerita-untuk-tidur"
  | "lapisan-sunyi"
  | "nada-menenangkan"
  | "larut-perlahan";

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
    id: "napas-pelan",
    order: 1,
    title: "Napas Pelan",
    subtitle: "Tenang dalam 5 menit",
    durationSec: 300.095,
    asset: require("../../assets/audio/sleep-guide/01-napas-pelan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/master/01-master-sleep-guide.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-thumbnail-sleep-guide.jpg"),
    isPremium: false,
  },
  {
    id: "body-scan",
    order: 2,
    title: "Body Scan",
    subtitle: "Lepaskan tegang perlahan",
    durationSec: 300.095,
    asset: require("../../assets/audio/sleep-guide/02-body-scan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/master/01-master-sleep-guide.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-thumbnail-sleep-guide.jpg"),
    isPremium: false,
  },
  {
    id: "pikiran-tenang",
    order: 3,
    title: "Pikiran Tenang",
    subtitle: "Redakan ramai di kepala",
    durationSec: 300.095,
    asset: require("../../assets/audio/sleep-guide/03-pikiran-tenang-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/master/01-master-sleep-guide.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-thumbnail-sleep-guide.jpg"),
    isPremium: false,
  },
  {
    id: "cerita-menenangkan",
    order: 4,
    title: "Cerita Tenang",
    subtitle: "Tidur ditemani cerita",
    durationSec: 300.095,
    asset: require("../../assets/audio/sleep-guide/04-cerita-menenangkan-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/master/01-master-sleep-guide.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-thumbnail-sleep-guide.jpg"),
    isPremium: false,
  },
  {
    id: "cerita-untuk-tidur",
    order: 5,
    title: "Cerita Tidur",
    subtitle: "Pikiran pulih jelang tidur",
    durationSec: 300.095,
    asset: require("../../assets/audio/sleep-guide/05-cerita-untuk-tidur-5m.m4a"),
    creator: "lumepo",
    category: "audio",
    tags: ["sleep-guide"],
    cover: require("../../assets/image/master/01-master-sleep-guide.jpg"),
    thumbnail: require("../../assets/image/thumbnail/01-thumbnail-sleep-guide.jpg"),
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
    cover: require("../../assets/image/master/02-master-soundscape.jpg"),
    thumbnail: require("../../assets/image/thumbnail/02-thumbnail-soundscape.jpg"),
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
    cover: require("../../assets/image/master/02-master-soundscape.jpg"),
    thumbnail: require("../../assets/image/thumbnail/02-thumbnail-soundscape.jpg"),
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
    cover: require("../../assets/image/master/02-master-soundscape.jpg"),
    thumbnail: require("../../assets/image/thumbnail/02-thumbnail-soundscape.jpg"),
    isPremium: false,
  },
] satisfies AudioTrack[];

export function getTrackById(id: AudioId): AudioTrack {
  const t = AUDIO_TRACKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown AudioId: ${id}`);
  return t;
}
