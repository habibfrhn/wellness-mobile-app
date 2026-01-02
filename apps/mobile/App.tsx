import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { NavigationContainer } from "@react-navigation/native";

import { supabase } from "./src/services/supabase";
import { handleAuthLink } from "./src/services/authLinks";
import AuthStack from "./src/navigation/AuthStack";

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"]>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    async function init() {
      // Handle app opened from deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await handleAuthLink(initialUrl);

      // Listen for links while running
      subscription = Linking.addEventListener("url", async ({ url }) => {
        await handleAuthLink(url);
      });

      // Load session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      // Sync session changes
      supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess);
      });

      setReady(true);
    }

    init();

    return () => {
      subscription?.remove?.();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Step 9.2: show auth flow when not logged in */}
      {!session ? <AuthStack /> : <AuthStack /> /* temp: we’ll replace with AppStack in Step 10 */}
    </NavigationContainer>
  );
}
