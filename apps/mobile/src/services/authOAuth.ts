import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { AUTH_CALLBACK, supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

type ContinueWithGoogleOptions = {
  nextRoute?: "Login" | "SignUp";
};

export async function continueWithGoogle({ nextRoute = "Login" }: ContinueWithGoogleOptions = {}) {
  await setNextAuthRoute(nextRoute);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_CALLBACK,
      queryParams: {
        prompt: "select_account",
      },
      skipBrowserRedirect: Platform.OS !== "web",
    },
  });

  if (error) {
    throw error;
  }

  if (Platform.OS !== "web" && data?.url) {
    await Linking.openURL(data.url);
  }
}
