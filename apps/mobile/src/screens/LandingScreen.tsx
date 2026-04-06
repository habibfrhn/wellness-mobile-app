import { Platform } from "react-native";
import LandingScreenNative from "./LandingScreen.native";
import LandingScreenWeb from "./LandingScreen.web";

const LandingScreen =
  Platform.OS === "web" ? LandingScreenWeb : LandingScreenNative;

export default LandingScreen;
