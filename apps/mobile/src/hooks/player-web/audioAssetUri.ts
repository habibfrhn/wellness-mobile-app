import { Asset } from "expo-asset";
import { Image } from "react-native";

export function getAudioAssetUri(asset: number): string | null {
  const fromImageResolver = Image.resolveAssetSource(asset)?.uri;
  if (fromImageResolver) {
    return fromImageResolver;
  }

  try {
    const expoAsset = Asset.fromModule(asset);
    return expoAsset.localUri ?? expoAsset.uri ?? null;
  } catch {
    return null;
  }
}
