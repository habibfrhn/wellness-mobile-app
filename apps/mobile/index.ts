import React, { Suspense, lazy, useMemo } from "react";
import { registerRootComponent } from "expo";
import { ActivityIndicator, Platform, View } from "react-native";

const AppEntry = lazy(() => import("./App"));
const LandingEntry = lazy(() => import("./src/web/LandingEntry.web"));

function FullScreenLoader() {
  return React.createElement(
    View,
    { style: { flex: 1, alignItems: "center", justifyContent: "center" } },
    React.createElement(ActivityIndicator),
  );
}

function normalizeWebPath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, "");
  if (!trimmed || trimmed === "/--") {
    return "/";
  }

  return trimmed;
}

function shouldUseLandingEntry() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const path = normalizeWebPath(window.location.pathname);
  return path === "/" || path === "/--";
}

function RootEntry() {
  const EntryComponent = useMemo(
    () => (shouldUseLandingEntry() ? LandingEntry : AppEntry),
    [],
  );

  return React.createElement(
    Suspense,
    { fallback: React.createElement(FullScreenLoader) },
    React.createElement(EntryComponent),
  );
}

registerRootComponent(RootEntry);
