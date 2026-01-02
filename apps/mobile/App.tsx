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
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await handleAuthLink(initialUrl);

      subscription = Linking.addEventListener("url", async ({ url }) => {
        await handleAuthLink(url);
      });

      const { data } = await supabase.auth.getSession();
      setSession(data.session);

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
      {!session ? <AuthStack /> : <AuthStack /> /* Step 10: replace with AppStack */}
    </NavigationContainer>
  );
}
