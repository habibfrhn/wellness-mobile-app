import React from "react";
import Carousel from "./Carousel";
import type { AudioTrack } from "../content/audioCatalog";

type HomeCarouselSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
  columns?: 1 | 2;
};

export default function HomeCarouselSection({ title, tracks, onPress, columns = 1 }: HomeCarouselSectionProps) {
  return <Carousel title={title} tracks={tracks} onPress={onPress} columns={columns} />;
}
