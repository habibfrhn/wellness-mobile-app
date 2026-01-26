import React from "react";
import Carousel from "./Carousel";
import type { AudioTrack } from "../content/audioCatalog";

type HomeCarouselSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
  variant?: "standard" | "featured";
};

export default function HomeCarouselSection({ title, tracks, onPress, variant }: HomeCarouselSectionProps) {
  return <Carousel title={title} tracks={tracks} onPress={onPress} variant={variant} />;
}
