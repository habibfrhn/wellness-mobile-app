import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, LogBox, Platform, View } from "react-native";
import * as Linking from "expo-linking";
import * as Updates from "expo-updates";
import {
  LinkingOptions,
  NavigationContainer,
  NavigatorScreenParams,
  createNavigationContainerRef,
  getStateFromPath as defaultGetStateFromPath,
} from "@react-navigation/native";
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
import { getWebAppOrigin, getWebAuthPath, replaceWebUrl } from "./src/services/webAuth";
import AdminDashboardScreen from "./src/screens/Admin/AdminDashboardScreen.web";
import { getUserAuthProviders, isUserVerified } from "./src/services/authProviders";
import { getProviderLockErrorMessage, isBlockedByProviderLock, lookupProviderLockByEmail } from "./src/services/authProviderLock";
import { logAuthDebugEvent } from "./src/services/authDebug";
import { restoreSession, signOutToLogin } from "./src/services/authSession";
import { logLogoutEvent } from "./src/services/logoutDebug";

type SessionType = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type RootStackParamList = {
  Landing: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const WEB_RESET_FLOW_KEY = "wellness.webResetFlow";


const WEB_APP_NAME = "Lumepo";
const WEB_EXPO_ROUTE_PREFIX = "/--";
const WEB_LEGACY_PATH_ALIASES: Record<string, string> = {
  "/login": "/masuk",
  "/signup": "/daftar",
  "/privacy-policy": "/kebijakan-privasi",
  "/terms-conditions": "/syarat-ketentuan",
};

const WEB_ROUTE_PATHS: Record<string, string> = {
  Landing: "/",
  Home: "/beranda",
  Login: "/masuk",
  SignUp: "/daftar",
  ForgotPassword: "/lupa-kata-sandi",
  ResetPassword: "/atur-ulang-kata-sandi",
  VerifyEmail: "/verifikasi-email",
  Welcome: "/selamat-datang",
  Player: "/pemutar-audio",
  Account: "/akun",
  Settings: "/pengaturan",
  PrivacyPolicy: "/kebijakan-privasi",
  TermsConditions: "/syarat-ketentuan",
  ReminderSettings: "/pengingat-tidur",
  NightMode: "/mode-malam",
  NightCheckIn: "/check-in-malam",
  NightStep1: "/langkah-1",
  NightStep2: "/langkah-2",
  NightStep3: "/langkah-3",
  NightCheckOut: "/check-out-malam",
  Admin: "/admin",
};

const WEB_ROUTE_TITLES: Record<string, string> = {
  Landing: "Beranda",
  Home: "Beranda",
  Login: "Masuk",
  SignUp: "Daftar",
  ForgotPassword: "Lupa Kata Sandi",
  ResetPassword: "Atur Ulang Kata Sandi",
  VerifyEmail: "Verifikasi Email",
  Welcome: "Selamat Datang",
  Player: "Pemutar Audio",
  Account: "Akun",
  Settings: "Pengaturan",
  PrivacyPolicy: "Kebijakan Privasi",
  TermsConditions: "Syarat & Ketentuan",
  ReminderSettings: "Pengingat Tidur",
  NightMode: "Mode Malam",
  NightCheckIn: "Check In Malam",
  NightStep1: "Langkah Tidur 1",
  NightStep2: "Langkah Tidur 2",
  NightStep3: "Langkah Tidur 3",
  NightCheckOut: "Check Out Malam",
  Admin: "Admin Analitik",
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

function normalizeWebPathForRoute(pathname: string) {
  const trimmedPath = pathname.replace(/\/+$/, "") || "/";
  const withoutExpoPrefix = trimmedPath.startsWith(WEB_EXPO_ROUTE_PREFIX)
    ? trimmedPath.slice(WEB_EXPO_ROUTE_PREFIX.length) || "/"
    : trimmedPath;
  const normalized = withoutExpoPrefix.toLowerCase();
  return WEB_LEGACY_PATH_ALIASES[normalized] ?? withoutExpoPrefix;
}

function getWebPathForRoute(routeName: string, fallback = "/") {
  return WEB_ROUTE_PATHS[routeName] ?? fallback;
}

function getCurrentRootRouteName() {
  const rootState = navigationRef.getRootState();
  const currentRootRoute = rootState?.routes[rootState.index ?? 0];
  return currentRootRoute ? String(currentRootRoute.name) : null;
}

function summarizeAuthUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const searchKeys = [...parsed.searchParams.keys()];
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const hashKeys = [...hashParams.keys()];

    return {
      origin: parsed.origin,
      pathname: parsed.pathname,
      searchKeys,
      hashKeys,
    };
  } catch {
    return { malformed: true };
  }
}

function isAdminRoutePath() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const { pathname } = window.location;
  return pathname.startsWith("/admin") || pathname.startsWith("/--/admin");
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

const WEB_KNOWN_RESPONDER_WARNINGS = [
  "Cannot record touch end without a touch start.",
  "Node cannot be found in the current page.",
  "props.pointerEvents is deprecated. Use style.pointerEvents",
] as const;

function shouldSuppressKnownWebResponderWarning(args: unknown[]) {
  if (Platform.OS !== "web" || args.length === 0) {
    return false;
  }

  const [firstArg] = args;
  if (typeof firstArg !== "string") {
    return false;
  }

  return WEB_KNOWN_RESPONDER_WARNINGS.some((warning) => firstArg.includes(warning));
}

if (__DEV__ && Platform.OS === "web") {
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleError = console.error.bind(console);

  console.warn = (...args: unknown[]) => {
    if (shouldSuppressKnownWebResponderWarning(args)) {
      return;
    }
    originalConsoleWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    if (shouldSuppressKnownWebResponderWarning(args)) {
      return;
    }
    originalConsoleError(...args);
  };
}

LogBox.ignoreLogs([
  "props.pointerEvents is deprecated. Use style.pointerEvents",
]);

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
  const [webAuthErrorBody, setWebAuthErrorBody] = useState<string | null>(null);

  const didCheckUpdatesRef = useRef(false);
  const webLinking = useMemo<LinkingOptions<RootStackParamList>>(
    () => ({
      prefixes:
        Platform.OS === "web" && typeof window !== "undefined"
          ? [window.location.origin, `${window.location.origin}${WEB_EXPO_ROUTE_PREFIX}`]
          : [Linking.createURL("/")],
      config: {
        screens: {
          Landing: "",
          Auth: {
            screens: {
              Login: "masuk",
              SignUp: "daftar",
              ForgotPassword: "lupa-kata-sandi",
              ResetPassword: "atur-ulang-kata-sandi",
              VerifyEmail: "verifikasi-email",
              Welcome: "selamat-datang",
            },
          },
          App: {
            screens: {
              Home: "beranda",
              Player: "pemutar-audio",
              Account: "akun",
              Settings: "pengaturan",
              PrivacyPolicy: "kebijakan-privasi",
              TermsConditions: "syarat-ketentuan",
              ReminderSettings: "pengingat-tidur",
              ResetPassword: "ubah-kata-sandi",
              NightMode: "mode-malam",
              NightCheckIn: "check-in-malam",
              NightStep1: "langkah-1",
              NightStep2: "langkah-2",
              NightStep3: "langkah-3",
              NightCheckOut: "check-out-malam",
            },
          },
        },
      },
      getStateFromPath(path, options) {
        const normalizedPath = normalizeWebPathForRoute(path);
        return defaultGetStateFromPath(normalizedPath, options);
      },
    }),
    []
  );

  const isVerified = useMemo(() => {
    return isUserVerified(session?.user);
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
      logAuthDebugEvent("info", "oauth_callback_process_start", {
        summary: summarizeAuthUrl(url),
      });
      let res: Awaited<ReturnType<typeof handleAuthLink>>;
      try {
        res = await handleAuthLink(url);
      } catch {
        logAuthDebugEvent("error", "oauth_callback_process_exception", {
          summary: summarizeAuthUrl(url),
        });
        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthStatus("error");
          setWebAuthErrorBody(null);
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

      logAuthDebugEvent("info", "oauth_callback_process_result", {
        handled: res.handled,
        ok: "ok" in res ? res.ok : false,
        path: "path" in res ? res.path : null,
        linkType: "linkType" in res ? res.linkType : null,
        hasSession: "session" in res ? Boolean(res.session) : false,
        userId: "session" in res ? (res.session?.user.id ?? null) : null,
      });

      if (!res.handled) {
        logAuthDebugEvent("warn", "oauth_callback_not_handled", {
          summary: summarizeAuthUrl(url),
        });
        await clearPendingProfileName();
        setWebAuthStatus("missing");
        return;
      }

      if (!res.ok) {
        logAuthDebugEvent("error", "oauth_callback_failed", {
          path: res.path,
          linkType: res.linkType,
          error: res.error,
        });
        const copy = getAuthLinkErrorCopy(res.error, res.linkType);
        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthStatus("error");
          setWebAuthErrorBody(copy.body);
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
        logAuthDebugEvent("info", "oauth_callback_reset_flow", {
          linkType: res.linkType,
        });
        setForceReset(true);
        setWebResetFlowActive(true);
        await setNextAuthRoute("ResetPassword");
        setAuthStartRoute("ResetPassword");
        replaceWebUrl(getWebPathForRoute("ResetPassword"));
        setWebAuthStatus("idle");
        return;
      }

      const isEmailVerificationLink = res.linkType === "signup" || res.linkType === "email_change";
      if (isEmailVerificationLink) {
        logAuthDebugEvent("info", "oauth_callback_email_verification_link", {
          linkType: res.linkType,
        });
        await signOutToLogin("global", { source: "email_verification_guard" });
        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        replaceWebUrl(getWebPathForRoute("Login"));
        setWebAuthStatus("idle");
        return;
      }

      if (!res.session) {
        logAuthDebugEvent("warn", "oauth_callback_missing_session", {
          path: res.path,
          linkType: res.linkType,
        });
        await clearPendingProfileName();
        setWebAuthStatus("missing");
        return;
      }

      const callbackEmail = res.session.user.email?.trim().toLowerCase() ?? "";
      const providerLock = callbackEmail ? await lookupProviderLockByEmail(callbackEmail) : { status: "ok" as const, exists: false, providers: [], primaryProvider: null, providerLock: null };
      const currentProviders = getUserAuthProviders(res.session.user).map((provider) => provider.toLowerCase());
      const currentProviderRaw = currentProviders.find((provider) => provider !== "email") ?? currentProviders[0] ?? "unknown";
      const currentProvider = currentProviderRaw as "email" | "google" | "apple" | "github" | "unknown";
      const lookupExists = providerLock.status === "ok" ? providerLock.exists : null;
      const lookupProviders = providerLock.status === "ok" ? providerLock.providers : [];
      const lookupPrimaryProvider = providerLock.status === "ok" ? providerLock.primaryProvider : null;
      const lookupProviderLock = providerLock.status === "ok" ? providerLock.providerLock : null;

      logAuthDebugEvent("info", "oauth_callback_provider_decision", {
        emailDomain: callbackEmail.split("@")[1] ?? null,
        callbackEmailPresent: Boolean(callbackEmail),
        lookupStatus: providerLock.status,
        lookupExists,
        lookupProviders,
        lookupPrimaryProvider,
        lookupProviderLock,
        sessionProviders: currentProviders,
        sessionDetectedProvider: currentProvider,
      });

      if (providerLock.status === "unavailable") {
        await signOutToLogin("global", { source: "provider_lock_oauth_callback" });
        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthErrorBody(id.auth.providerLockUnavailable);
          setWebAuthStatus("error");
        } else {
          Alert.alert(id.auth.providerLockTitle, id.auth.providerLockUnavailable);
        }

        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        replaceWebUrl(getWebPathForRoute("Login"));
        return;
      }

      const hasProviderLockViolation =
        providerLock.exists &&
        isBlockedByProviderLock(providerLock.providerLock, "google_oauth", currentProvider);

      const hasLinkedProviderStateViolation =
        Boolean(lookupExists) &&
        lookupProviders.includes("email") &&
        lookupProviders.some((provider) => provider !== "email") &&
        currentProvider !== "email" &&
        (lookupProviderLock === "email" || lookupPrimaryProvider === "email");

      const hasSessionProviderLinkViolation =
        currentProviders.includes("email") &&
        currentProviders.some((provider) => provider !== "email") &&
        (lookupProviderLock === "email" || lookupPrimaryProvider === "email");

      if (hasProviderLockViolation || hasLinkedProviderStateViolation || hasSessionProviderLinkViolation) {
        const blockReason = hasSessionProviderLinkViolation
          ? "SESSION_PROVIDER_LINK_VIOLATION"
          : hasLinkedProviderStateViolation
            ? "LOOKUP_PROVIDER_LINK_VIOLATION"
            : "PROVIDER_LOCK_MISMATCH";
        logAuthDebugEvent("warn", "oauth_callback_provider_blocked", {
          reason: blockReason,
          lookupProviderLock,
          lookupPrimaryProvider,
          lookupProviders,
          sessionProviders: currentProviders,
          sessionDetectedProvider: currentProvider,
        });
        await signOutToLogin("global", { source: "provider_lock_oauth_callback" });
        const providerLockMessage = getProviderLockErrorMessage(lookupProviderLock ?? lookupPrimaryProvider, "google_oauth");

        if (Platform.OS === "web" && getWebAuthPath(typeof window !== "undefined" ? window.location.pathname : null)) {
          setWebAuthErrorBody(providerLockMessage);
          setWebAuthStatus("error");
        } else {
          Alert.alert(id.auth.providerLockTitle, providerLockMessage);
        }

        await setNextAuthRoute("Login");
        setAuthStartRoute("Login");
        setForceReset(false);
        setWebResetFlowActive(false);
        replaceWebUrl(getWebPathForRoute("Login"));
        return;
      }

      logAuthDebugEvent("info", "oauth_callback_success", {
        path: res.path,
        linkType: res.linkType,
        userId: res.session.user.id,
        sessionProviders: currentProviders,
      });
      setSession(res.session);
      replaceWebUrl(getWebPathForRoute("Home"));
      setWebAuthErrorBody(null);
      setWebAuthStatus("idle");
    }

    async function init() {
      if (isWebResetFlowActive()) {
        setForceReset(true);
        setAuthStartRoute("ResetPassword");
      }

      const initialUrl = await Linking.getInitialURL();
      const initialWebAuthPath = Platform.OS === "web" && typeof window !== "undefined" ? getWebAuthPath(window.location.pathname) : null;
      const initialWebUrl = Platform.OS === "web" && typeof window !== "undefined" ? window.location.href : null;
      const initialAuthUrl = initialWebAuthPath && initialWebUrl ? initialWebUrl : initialUrl;
      logAuthDebugEvent("info", "oauth_callback_bootstrap", {
        detectedWebPath: initialWebAuthPath,
        webLocation: summarizeAuthUrl(initialWebUrl),
        initialLinkingUrl: summarizeAuthUrl(initialUrl),
        shouldUseConfiguredOrigin: Platform.OS === "web",
        configuredOrigin: Platform.OS === "web" ? getWebAppOrigin() : null,
      });

      if (initialWebAuthPath) {
        setWebAuthStatus("loading");
      }

      const shouldProcessInitialUrl =
        typeof initialAuthUrl === "string" &&
        (Platform.OS !== "web" || Boolean(initialWebAuthPath) || isPotentialAuthLink(initialAuthUrl));

      if (typeof initialAuthUrl === "string" && shouldProcessInitialUrl) {
        logAuthDebugEvent("info", "oauth_callback_initial_url", {
          initialUrl: summarizeAuthUrl(initialUrl),
          initialAuthUrl: summarizeAuthUrl(initialAuthUrl),
          initialWebAuthPath,
        });
        await processUrl(initialAuthUrl);
      } else if (initialWebAuthPath) {
        logAuthDebugEvent("warn", "oauth_callback_initial_missing_params", {
          initialUrl: summarizeAuthUrl(initialUrl),
          initialAuthUrl: summarizeAuthUrl(initialAuthUrl),
          initialWebAuthPath,
        });
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

      const restoredSession = await restoreSession();
      logAuthDebugEvent("info", "oauth_session_after_init_get_session", {
        hasSession: Boolean(restoredSession.session),
        userId: restoredSession.session?.user.id ?? null,
        recovered: restoredSession.recovered,
      });
      logLogoutEvent("info", "logout_init_session_rehydration_result", {
        hasSession: Boolean(restoredSession.session),
        userId: restoredSession.session?.user.id ?? null,
        recovered: restoredSession.recovered,
      });
      setSession(restoredSession.session);

      const hasResetHint =
        typeof initialUrl === "string" &&
        (initialUrl.toLowerCase().includes("auth_flow=reset") ||
          initialUrl.toLowerCase().includes("type=recovery") ||
          initialUrl.toLowerCase().includes("auth/reset"));

      if (!restoredSession.session && !hasResetHint) {
        setForceReset(false);
        setWebResetFlowActive(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((event, sess) => {
        logAuthDebugEvent("info", "oauth_auth_state_change", {
          event,
          hasSession: Boolean(sess),
          userId: sess?.user.id ?? null,
          provider: sess?.user?.app_metadata?.provider ?? null,
        });
        logLogoutEvent("info", "logout_auth_state_change", {
          event,
          hasSession: Boolean(sess),
          userId: sess?.user.id ?? null,
        });
        setSession(sess);
        if (event === "SIGNED_OUT") {
          setForceReset(false);
          setWebResetFlowActive(false);
          setAuthStartRoute("Login");
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
    const rootState = navigationRef.getRootState();
    const currentRootRoute = rootState?.routes[rootState.index ?? 0];
    if (!currentRoute || !currentRootRoute) {
      return;
    }
    const currentRouteName = String(currentRoute.name);
    const currentRootRouteName = String(currentRootRoute.name);

    if (!shouldShowAuth) {
      if (currentRootRouteName !== "App") {
        logLogoutEvent("info", "logout_navigation_redirect", {
          destination: "App",
          reason: "authenticated_session",
          currentRouteName,
          currentRootRouteName,
        });
        navigationRef.resetRoot({ index: 0, routes: [{ name: "App" }] });
      }
      return;
    }

    if (shouldAutoOpenWebAuth) {
      const requestedAuthScreen =
        authStartRoute === "SignUp" ? "SignUp" : initialAuthRoute === "ResetPassword" ? "ResetPassword" : "Login";

      if (currentRootRouteName !== "Auth") {
        logLogoutEvent("info", "logout_navigation_redirect", {
          destination: "Auth",
          reason: "missing_or_unverified_session",
          requestedAuthScreen,
          currentRouteName,
          currentRootRouteName,
        });
        navigationRef.resetRoot({
          index: 0,
          routes: [{ name: "Auth", params: { screen: requestedAuthScreen } }],
        });

        const currentRootAfterReset = getCurrentRootRouteName();
        logLogoutEvent("info", "logout_navigation_redirect_result", {
          destination: "Auth",
          requestedAuthScreen,
          currentRootRouteNameAfter: currentRootAfterReset,
        });

        if (Platform.OS === "web" && currentRootAfterReset !== "Auth") {
          const webPath = getWebPathForRoute(requestedAuthScreen, "/masuk");
          replaceWebUrl(webPath);
          if (typeof window !== "undefined") {
            window.location.assign(webPath);
          }
        }
      }
      return;
    }

    if (currentRootRouteName === "App") {
      logLogoutEvent("info", "logout_navigation_redirect", {
        destination: "Landing",
        reason: "show_landing_for_unauthenticated",
        currentRouteName,
        currentRootRouteName,
      });
      navigationRef.resetRoot({ index: 0, routes: [{ name: "Landing" }] });
      const currentRootAfterReset = getCurrentRootRouteName();
      logLogoutEvent("info", "logout_navigation_redirect_result", {
        destination: "Landing",
        currentRootRouteNameAfter: currentRootAfterReset,
      });

      if (Platform.OS === "web" && currentRootAfterReset !== "Landing") {
        replaceWebUrl("/");
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
      }
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
      replaceWebUrl(getWebPathForRoute("Login"));
      setWebAuthStatus("idle");
      setWebAuthErrorBody(null);
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
        body={webAuthErrorBody ?? id.auth.callbackErrorBody}
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
          linking={Platform.OS === "web" ? webLinking : undefined}
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
