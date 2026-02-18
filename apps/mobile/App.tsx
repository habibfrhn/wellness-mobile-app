import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, LogBox, Platform, View } from "react-native";
import * as Linking from "expo-linking";
import * as Updates from "expo-updates";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { hasSupabaseEnv, missingSupabaseEnvMessage, supabase } from "./src/services/supabase";
import { handleAuthLink } from "./src/services/authLinks";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";
import type { AuthStackParamList } from "./src/navigation/types";
import LandingScreen from "./src/screens/LandingScreen";
import { id } from "./src/i18n/strings";
import { hideSplashScreen, preventAutoHideSplashScreen } from "./src/services/splashScreen";
import { setPendingUpdate } from "./src/services/updatesState";
import { clearNextAuthRoute, getNextAuthRoute } from "./src/services/authStart";

type SessionType = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();


LogBox.ignoreLogs(["props.pointerEvents is deprecated. Use style.pointerEvents"]);

type ConsoleWithPointerEventsGuard = Console & {
  __wellnessPointerEventsWarnGuard?: boolean;
};

if (Platform.OS === "web") {
  const guardedConsole = console as ConsoleWithPointerEventsGuard;

  if (!guardedConsole.__wellnessPointerEventsWarnGuard) {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const [firstArg] = args;
      if (
        typeof firstArg === "string" &&
        firstArg.includes("props.pointerEvents is deprecated. Use style.pointerEvents")
      ) {
        return;
      }

      originalWarn(...args);
    };

    guardedConsole.__wellnessPointerEventsWarnGuard = true;
  }
}

preventAutoHideSplashScreen().catch(() => {
  // no-op if it's already hidden
});

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionType>(null);
  const [authStartResolved, setAuthStartResolved] = useState(true);

  // If user comes from reset link, force AuthStack to start at ResetPassword.
  const [forceReset, setForceReset] = useState(false);
  const [authStartRoute, setAuthStartRoute] = useState<keyof AuthStackParamList>("Welcome");

  const didCheckUpdatesRef = useRef(false);

  const isVerified = useMemo(() => {
    const user = session?.user;
    // Supabase uses email_confirmed_at for email verification status
    return Boolean(user?.email_confirmed_at);
  }, [session]);

  useEffect(() => {
    let linkSubscription: { remove: () => void } | undefined;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function processUrl(url: string) {
      const res = await handleAuthLink(url);
      if (res.handled && res.ok && res.path === "auth/reset") {
        setForceReset(true);
      }
    }

    async function init() {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await processUrl(initialUrl);

      linkSubscription = Linking.addEventListener("url", async ({ url }) => {
        await processUrl(url);
      });

      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess);
      });
      authSubscription = authListener?.subscription;

      setReady(true);
    }

    init();

    return () => {
      linkSubscription?.remove?.();
      authSubscription?.unsubscribe?.();
    };
  }, []);

  const onLayoutRootView = async () => {
    if (!ready) return;
    try {
      await hideSplashScreen();
    } catch {
      // no-op if it's already hidden
    }
  };

  useEffect(() => {
    if (hasSupabaseEnv) return;

    Alert.alert(id.common.errorTitle, missingSupabaseEnvMessage);
  }, []);

  // Clear reset override once user signs out (we sign out after reset success)
  useEffect(() => {
    if (!session) setForceReset(false);
  }, [session]);

  useEffect(() => {
    let mounted = true;

    if (!session) {
      setAuthStartResolved(false);
      (async () => {
        const nextRoute = await getNextAuthRoute();
        if (!mounted) return;
        if (nextRoute) {
          setAuthStartRoute(nextRoute);
          await clearNextAuthRoute();
          if (nextRoute === "Login") setForceReset(false);
        } else {
          setAuthStartRoute("Welcome");
        }
        setAuthStartResolved(true);
      })();
    } else {
      setAuthStartResolved(true);
    }

    return () => {
      mounted = false;
    };
  }, [session]);

  // Check OTA updates once per launch (only for standalone/dev-client builds where updates are enabled).
  useEffect(() => {
    if (!ready) return;
    if (didCheckUpdatesRef.current) return;
    didCheckUpdatesRef.current = true;

    if (!Updates.isEnabled) return;

    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) {
          await setPendingUpdate(false);
          return;
        }

        Alert.alert(
          id.account.updatesAvailableTitle,
          id.account.updatesAvailableBody,
          [
            {
              text: id.account.updatesLater,
              style: "cancel",
              onPress: async () => {
                await setPendingUpdate(true);
                Alert.alert(id.account.updatesLaterTitle, id.account.updatesLaterBody);
              },
            },
            {
              text: id.common.ok,
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await setPendingUpdate(false);
                  await Updates.reloadAsync();
                } catch {
                  await setPendingUpdate(true);
                  Alert.alert(id.common.errorTitle, id.account.updatesFailed);
                }
              },
            },
          ]
        );
      } catch {
        // silent fail on startup; user can still manually check in Account
      }
    })();
  }, [ready]);

  if (!ready || (!session && !authStartResolved)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const shouldShowAuth = forceReset || !session || !isVerified;
  const initialAuthRoute =
    authStartRoute === "Login" ? "Login" : forceReset ? "ResetPassword" : authStartRoute;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          {Platform.OS === "web" ? (
            shouldShowAuth ? (
              <RootStack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Landing" component={LandingScreen} />
                <RootStack.Screen name="Auth">
                  {() => <AuthStack key={`auth-${initialAuthRoute}`} initialRouteName={initialAuthRoute} />}
                </RootStack.Screen>
                <RootStack.Screen name="App" component={AppStack} />
              </RootStack.Navigator>
            ) : (
              <AppStack />
            )
          ) : shouldShowAuth ? (
            <AuthStack key={`auth-${initialAuthRoute}`} initialRouteName={initialAuthRoute} />
          ) : (
            <AppStack />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
