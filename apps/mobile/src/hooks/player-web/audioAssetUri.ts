import { Image } from "react-native";

export function getAudioAssetUri(asset: number) {
  const resolved = Image.resolveAssetSource(asset);
  if (!resolved?.uri) {
    throw new Error("Audio asset URI could not be resolved.");
  }
  return resolved.uri;
}
