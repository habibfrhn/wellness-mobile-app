import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, LogBox, Platform, View } from "react-native";
import * as Linking from "expo-linking";
import * as Updates from "expo-updates";
import { NavigationContainer, NavigatorScreenParams, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { hasSupabaseEnv, missingSupabaseEnvMessage, supabase } from "./src/services/supabase";
import { handleAuthLink, isPotentialAuthLink } from "./src/services/authLinks";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";
import type { AuthStackParamList } from "./src/navigation/types";
import LandingScreen from "./src/screens/LandingScreen";
import { id } from "./src/i18n/strings";
import { hideSplashScreen, preventAutoHideSplashScreen } from "./src/services/splashScreen";
import { setPendingUpdate } from "./src/services/updatesState";
import { clearNextAuthRoute, getNextAuthRoute, setNextAuthRoute } from "./src/services/authStart";
import { clearPendingProfileName, getPendingProfileName } from "./src/services/pendingProfileName";
import WebAuthStatusScreen from "./src/components/auth/WebAuthStatusScreen";
import { getWebAuthPath, replaceWebUrl } from "./src/services/webAuth";
import AdminDashboardScreen from "./src/screens/Admin/AdminDashboardScreen.web";

type SessionType = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type RootStackParamList = {
  Landing: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const WEB_RESET_FLOW_KEY = "wellness.webResetFlow";


const WEB_APP_NAME = "Lumepo";

const WEB_ROUTE_TITLES: Record<string, string> = {
  Landing: "Beranda",
  Home: "Beranda",
  Login: "Log in",
  SignUp: "Sign up",
  ForgotPassword: "Forgot password",
  ResetPassword: "Reset password",
  VerifyEmail: "Verify email",
  Welcome: "Welcome",
  Player: "Audio Player",
  Account: "Account",
  Settings: "Pengaturan",
  PrivacyPolicy: "Kebijakan Privasi",
  TermsConditions: "Syarat & Ketentuan",
  ReminderSettings: "Reminder settings",
  NightMode: "Night mode",
  NightCheckIn: "Check in",
  NightStep1: "Sleep step 1",
  NightStep2: "Sleep step 2",
  NightStep3: "Sleep step 3",
  NightCheckOut: "Check out",
  Admin: "Admin Analytics",
};

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function formatWebTitle(routeName?: string) {
  const screenTitle = (routeName && WEB_ROUTE_TITLES[routeName]) || "Beranda";
  return `${screenTitle} | ${WEB_APP_NAME}`;
}

function syncWebTitle(routeName?: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  document.title = formatWebTitle(routeName);
}

function isAdminRoutePath() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const { pathname, search, hash } = window.location;
  if (pathname.startsWith("/admin") || pathname.startsWith("/--/admin")) {
    return true;
  }

  const adminQuery = new URLSearchParams(search).get("admin");
  if (adminQuery === "1" || adminQuery === "true") {
    return true;
  }

  const normalizedHash = hash.replace(/^#/, "");
  return normalizedHash.startsWith("/admin");
}

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
  const [webAuthStatus, setWebAuthStatus] = useState<"idle" | "loading" | "error" | "missing">("idle");

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

    async function processUrl(url: string) {
      let res: Awaited<ReturnType<typeof handleAuthLink>>;
      try {
        res = await handleAuthLink(url);
      } catch {
        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthStatus("error");
        } else {
          Alert.alert(id.common.errorTitle, id.common.tryAgain);
        }
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        await clearPendingProfileName();
        return;
      }

      if (!res.handled) {
        await clearPendingProfileName();
        setWebAuthStatus("missing");
        return;
      }

      if (!res.ok) {
        const copy = getAuthLinkErrorCopy(res.error, res.linkType);
        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthStatus("error");
        } else {
          Alert.alert(copy.title, copy.body);
        }
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        await clearPendingProfileName();
        return;
      }

      if (res.path === "auth/reset") {
        setForceReset(true);
        setWebResetFlowActive(true);
        await setNextAuthRoute("ResetPassword");
        setAuthStartRoute("ResetPassword");
        replaceWebUrl("/");
        setWebAuthStatus("idle");
        return;
      }

      const isEmailVerificationLink = res.linkType === "signup" || res.linkType === "email_change";
      if (isEmailVerificationLink) {
        await supabase.auth.signOut();
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        replaceWebUrl("/");
        setWebAuthStatus("idle");
        return;
      }

      if (!res.session) {
        await clearPendingProfileName();
        setWebAuthStatus("missing");
        return;
      }

      replaceWebUrl("/");
      setWebAuthStatus("idle");
    }

    async function init() {
      if (isWebResetFlowActive()) {
        setForceReset(true);
        setAuthStartRoute("ResetPassword");
      }

      const initialUrl = await Linking.getInitialURL();
      const initialWebAuthPath = Platform.OS === "web" && typeof window !== "undefined" ? getWebAuthPath(window.location.pathname) : null;
      if (initialWebAuthPath) {
        setWebAuthStatus("loading");
      }

      const shouldProcessInitialUrl =
        typeof initialUrl === "string" &&
        (Platform.OS !== "web" || Boolean(initialWebAuthPath) || isPotentialAuthLink(initialUrl));

      if (typeof initialUrl === "string" && shouldProcessInitialUrl) {
        await processUrl(initialUrl);
      } else if (initialWebAuthPath) {
        setWebAuthStatus("missing");
      }

      linkSubscription = Linking.addEventListener("url", async ({ url }) => {
        if (Platform.OS === "web" && !isPotentialAuthLink(url)) {
          return;
        }

        if (Platform.OS === "web") {
          setWebAuthStatus("loading");
        }
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

  useEffect(() => {
    let cancelled = false;

    const applyPendingProfileName = async () => {
      if (!session?.user?.id) {
        return;
      }

      const pendingProfileName = await getPendingProfileName();
      if (!pendingProfileName) {
        return;
      }

      const currentProfileName = (session.user.user_metadata?.full_name as string | undefined)?.trim() ?? "";
      if (currentProfileName) {
        await clearPendingProfileName();
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { full_name: pendingProfileName },
      });

      if (!cancelled && !error) {
        await clearPendingProfileName();
      }
    };

    void applyPendingProfileName();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.user_metadata]);

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

  useEffect(() => {
    if (Platform.OS !== "web" || webAuthStatus !== "missing") {
      return;
    }

    replaceWebUrl("/");
    setWebAuthStatus("idle");
    setForceReset(false);
    setWebResetFlowActive(false);
    setAuthStartRoute("Welcome");
    void clearNextAuthRoute();
  }, [webAuthStatus]);

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
  const initialWebRootRoute = shouldShowAuth ? (shouldAutoOpenWebAuth ? "Auth" : "Landing") : "App";

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      !navigationRef.isReady() ||
      !ready ||
      webAuthStatus !== "idle" ||
      isAdminRoutePath()
    ) {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute();
    if (!currentRoute) {
      return;
    }
    const currentRouteName = String(currentRoute.name);

    if (!shouldShowAuth) {
      if (currentRouteName !== "App") {
        navigationRef.resetRoot({ index: 0, routes: [{ name: "App" }] });
      }
      return;
    }

    if (shouldAutoOpenWebAuth) {
      const requestedAuthScreen =
        authStartRoute === "SignUp" ? "SignUp" : initialAuthRoute === "ResetPassword" ? "ResetPassword" : "Login";

      if (currentRouteName !== "Auth") {
        navigationRef.navigate("Auth", { screen: requestedAuthScreen });
      }
      return;
    }

    if (currentRouteName === "App") {
      navigationRef.navigate("Landing");
    }
  }, [
    authStartRoute,
    initialAuthRoute,
    ready,
    shouldAutoOpenWebAuth,
    shouldShowAuth,
    webAuthStatus,
  ]);

  if (!ready || (!session && !authStartResolved)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (Platform.OS === "web" && webAuthStatus !== "idle") {
    const onReturnToLogin = () => {
      replaceWebUrl("/");
      setWebAuthStatus("idle");
      void setNextAuthRoute("Login");
      setAuthStartRoute("Login");
    };

    if (webAuthStatus === "loading") {
      return (
        <WebAuthStatusScreen
          title={id.auth.callbackLoadingTitle}
          body={id.auth.callbackLoadingBody}
          busy
        />
      );
    }

    if (webAuthStatus === "missing") {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <WebAuthStatusScreen
        title={id.auth.callbackErrorTitle}
        body={id.auth.callbackErrorBody}
        actionLabel={id.auth.callbackAction}
        onAction={onReturnToLogin}
      />
    );
  }

  if (isAdminRoutePath()) {
    syncWebTitle("Admin");
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <AdminDashboardScreen session={session} />
        </SafeAreaProvider>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => syncWebTitle(navigationRef.getCurrentRoute()?.name)}
          onStateChange={() => syncWebTitle(navigationRef.getCurrentRoute()?.name)}
        >
          {Platform.OS === "web" ? (
            <RootStack.Navigator
              initialRouteName={initialWebRootRoute}
              screenOptions={{ headerShown: false }}
            >
              <RootStack.Screen name="Landing" component={LandingScreen} />
              <RootStack.Screen name="Auth">
                {({ route }) => {
                  const requestedRoute = route.params?.screen;
                  const resolvedInitialRoute =
                    requestedRoute === "Login" || requestedRoute === "SignUp" || requestedRoute === "ResetPassword"
                      ? requestedRoute
                      : initialAuthRoute === "ResetPassword"
                        ? "ResetPassword"
                        : "Login";

                  return <AuthStack initialRouteName={resolvedInitialRoute} includeWelcome={false} />;
                }}
              </RootStack.Screen>
              <RootStack.Screen name="App" component={AppStack} />
            </RootStack.Navigator>
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
