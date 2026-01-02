import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { NavigationContainer } from "@react-navigation/native";

import { supabase } from "./src/services/supabase";
import { handleAuthLink } from "./src/services/authLinks";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";

type SessionType = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionType>(null);

  // If user comes from reset link, force AuthStack to start at ResetPassword.
  const [forceReset, setForceReset] = useState(false);

  const isVerified = useMemo(() => {
    const user = session?.user;
    // Supabase uses email_confirmed_at for email verification status
    return Boolean(user?.email_confirmed_at);
  }, [session]);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    async function processUrl(url: string) {
      const res = await handleAuthLink(url);
      if (res.handled && res.ok && res.path === "auth/reset") {
        setForceReset(true);
      }
    }

    async function init() {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await processUrl(initialUrl);

      subscription = Linking.addEventListener("url", async ({ url }) => {
        await processUrl(url);
      });

      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess);
      });

      setReady(true);
    }

    init();

    return () => subscription?.remove?.();
  }, []);

  // Clear reset override once user signs out (we sign out after reset success)
  useEffect(() => {
    if (!session) setForceReset(false);
  }, [session]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const shouldShowAuth = forceReset || !session || !isVerified;

  return (
    <NavigationContainer>
      {shouldShowAuth ? (
        <AuthStack initialRouteName={forceReset ? "ResetPassword" : "Welcome"} />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}
