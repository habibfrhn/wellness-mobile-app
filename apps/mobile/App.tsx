import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as Linking from "expo-linking";

import { supabase } from "./src/services/supabase";
import { handleAuthLink } from "./src/services/authLinks";

export default function App() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    async function init() {
      // 1) Handle app opened via a deep link (verification/reset)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const res = await handleAuthLink(initialUrl);
        if (res.handled) {
          setStatus(
            res.ok
              ? `Auth link handled: ${res.path}`
              : `Auth link error: ${res.error}`
          );
        }
      }

      // 2) Handle deep links while app is running
      subscription = Linking.addEventListener("url", async ({ url }) => {
        const res = await handleAuthLink(url);
        if (res.handled) {
          setStatus(
            res.ok
              ? `Auth link handled: ${res.path}`
              : `Auth link error: ${res.error}`
          );
        }
      });

      // 3) Load existing session from secure storage
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);

      // 4) Keep UI in sync with auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email ?? null);
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
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, textAlign: "center" }}>
        {email ? `Logged in as: ${email}` : "Not logged in"}
      </Text>

      {status ? (
        <Text style={{ marginTop: 12, textAlign: "center", opacity: 0.7 }}>
          {status}
        </Text>
      ) : null}

      <Text style={{ marginTop: 18, textAlign: "center", opacity: 0.6 }}>
        Step 8.3: Deep links wired. Next: build auth screens (signup/login/verify/reset).
      </Text>
    </View>
  );
}
