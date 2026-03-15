import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, LogBox, Platform, View } from "react-native";
import * as Linking from "expo-linking";
import * as Updates from "expo-updates";
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native";
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
import { clearNextAuthRoute, getNextAuthRoute, setNextAuthRoute } from "./src/services/authStart";

type SessionType = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type RootStackParamList = {
  Landing: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const WEB_RESET_FLOW_KEY = "wellness.webResetFlow";

function isWebResetFlowActive() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(WEB_RESET_FLOW_KEY) === "1";
}

function setWebResetFlowActive(active: boolean) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  if (active) {
    window.localStorage.setItem(WEB_RESET_FLOW_KEY, "1");
    return;
  }

  window.localStorage.removeItem(WEB_RESET_FLOW_KEY);
}

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

    function getAuthLinkErrorCopy(error?: string, linkType?: string) {
      const normalized = (error ?? "").toLowerCase();
      const isRecovery = linkType === "recovery";

      if (
        normalized.includes("expired") ||
        normalized.includes("otp_expired") ||
        normalized.includes("flow_state_expired") ||
        normalized.includes("flow state has expired")
      ) {
        return isRecovery
          ? { title: id.reset.linkExpiredTitle, body: id.reset.linkExpiredBody }
          : { title: id.common.linkExpiredTitle, body: id.common.linkExpiredBody };
      }

      if (
        normalized.includes("already") ||
        normalized.includes("used") ||
        normalized.includes("flow state not found") ||
        normalized.includes("flow_state_not_found") ||
        normalized.includes("verified")
      ) {
        return isRecovery
          ? { title: id.reset.linkUsedTitle, body: id.reset.linkUsedBody }
          : { title: id.common.linkAlreadyUsedTitle, body: id.common.linkAlreadyUsedBody };
      }

      return isRecovery
        ? { title: id.reset.linkInvalidTitle, body: id.reset.linkInvalidBody }
        : { title: id.common.linkInvalidTitle, body: id.common.linkInvalidBody };
    }

    function cleanupWebAuthUrl() {
      if (Platform.OS !== "web" || typeof window === "undefined") {
        return;
      }

      window.history.replaceState({}, "", window.location.pathname);
    }

    async function processUrl(url: string) {
      const res = await handleAuthLink(url);
      if (!res.handled) {
        return;
      }

      cleanupWebAuthUrl();

      if (!res.ok) {
        const copy = getAuthLinkErrorCopy(res.error, res.linkType);
        Alert.alert(copy.title, copy.body);
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        return;
      }

      if (res.path === "auth/reset") {
        setForceReset(true);
        setWebResetFlowActive(true);
        await setNextAuthRoute("ResetPassword");
        setAuthStartRoute("ResetPassword");
        return;
      }

      const isEmailVerificationLink = res.linkType === "signup" || res.linkType === "email_change";
      if (isEmailVerificationLink) {
        await supabase.auth.signOut();
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
      }
    }

    async function init() {
      if (isWebResetFlowActive()) {
        setForceReset(true);
        setAuthStartRoute("ResetPassword");
      }

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await processUrl(initialUrl);

      linkSubscription = Linking.addEventListener("url", async ({ url }) => {
        await processUrl(url);
      });

      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      const hasResetHint =
        typeof initialUrl === "string" &&
        (initialUrl.toLowerCase().includes("auth_flow=reset") ||
          initialUrl.toLowerCase().includes("type=recovery") ||
          initialUrl.toLowerCase().includes("auth/reset"));

      if (!data.session && !hasResetHint) {
        setForceReset(false);
        setWebResetFlowActive(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((event, sess) => {
        setSession(sess);
        if (event === "SIGNED_OUT") {
          setForceReset(false);
          setWebResetFlowActive(false);
        }
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

  useEffect(() => {
    let mounted = true;

    setAuthStartResolved(false);
    (async () => {
      const nextRoute = await getNextAuthRoute();
      if (!mounted) return;

      if (nextRoute) {
        setAuthStartRoute(nextRoute);
        if (nextRoute === "ResetPassword") {
          setForceReset(true);
        }
        if (nextRoute === "Login") {
          setForceReset(false);
        }
        await clearNextAuthRoute();
      } else if (!session) {
        setAuthStartRoute("Welcome");
      }

      setAuthStartResolved(true);
    })();

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
    authStartRoute === "Login"
      ? "Login"
      : authStartRoute === "SignUp"
        ? "SignUp"
        : forceReset
          ? "ResetPassword"
          : authStartRoute;

  const shouldAutoOpenWebAuth =
    forceReset || authStartRoute === "Login" || authStartRoute === "SignUp" || authStartRoute === "ResetPassword";

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          {Platform.OS === "web" ? (
            shouldShowAuth ? (
              <RootStack.Navigator
                key={`web-root-${shouldAutoOpenWebAuth ? "auth" : "landing"}`}
                initialRouteName={shouldAutoOpenWebAuth ? "Auth" : "Landing"}
                screenOptions={{ headerShown: false }}
              >
                <RootStack.Screen name="Landing" component={LandingScreen} />
                <RootStack.Screen name="Auth">
                  {({ route }) => {
                    const requestedRoute = route.params?.screen;
                    const resolvedInitialRoute =
                      requestedRoute === "Login" || requestedRoute === "SignUp"
                        ? requestedRoute
                        : initialAuthRoute === "ResetPassword"
                          ? "ResetPassword"
                          : "Login";

                    return (
                      <AuthStack
                        key={`auth-${resolvedInitialRoute}`}
                        initialRouteName={resolvedInitialRoute}
                        includeWelcome={false}
                      />
                    );
                  }}
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
