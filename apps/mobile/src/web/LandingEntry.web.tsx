import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AppStackParamList, AuthStackParamList } from "../navigation/types";
import LandingScreen from "../screens/LandingScreen";

const AuthStack = lazy(() => import("../navigation/AuthStack"));
const PrivacyPolicyScreen = lazy(() => import("../screens/App/PrivacyPolicyScreen.web"));
const TermsConditionsScreen = lazy(() => import("../screens/App/TermsConditionsScreen.web"));

type LandingAppStackParamList = {
  Landing: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  App: NavigatorScreenParams<AppStackParamList> | undefined;
};

const RootStack = createNativeStackNavigator<LandingAppStackParamList>();
const LegalStack = createNativeStackNavigator<AppStackParamList>();

function FullScreenLoader() {
  return React.createElement(
    View,
    { style: { flex: 1, alignItems: "center", justifyContent: "center" } },
    React.createElement(ActivityIndicator),
  );
}

function syncLandingMetaDescription() {
  if (typeof document === "undefined") {
    return;
  }

  const metaDescription =
    "Ritual malam 15 menit untuk menutup hari dengan tenang bersama Lumepo.";
  let tag = document.querySelector('meta[name="description"]');

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", metaDescription);
}

export default function LandingEntry() {
  useEffect(() => {
    syncLandingMetaDescription();
  }, []);

  return React.createElement(
    NavigationContainer,
    null,
    React.createElement(
      RootStack.Navigator as any,
      { initialRouteName: "Landing", screenOptions: { headerShown: false } },
      React.createElement(RootStack.Screen, { name: "Landing", component: LandingScreen }),
      // eslint-disable-next-line react/no-children-prop
      React.createElement(RootStack.Screen, {
        name: "Auth",
        children: ({ route }: { route: { params?: { screen?: string } } }) => {
          const requestedRoute = route.params?.screen;
          const resolvedInitialRoute =
            requestedRoute === "Login" || requestedRoute === "SignUp" || requestedRoute === "ResetPassword"
              ? requestedRoute
              : "Login";

          return React.createElement(
            Suspense,
            { fallback: React.createElement(FullScreenLoader) },
            React.createElement(AuthStack, { initialRouteName: resolvedInitialRoute, includeWelcome: false }),
          );
        },
      }),
      // eslint-disable-next-line react/no-children-prop
      React.createElement(RootStack.Screen, {
        name: "App",
        children: ({ route }: { route: { params?: { screen?: string } } }) => {
          const appScreen = route.params?.screen;

          return React.createElement(
            Suspense,
            { fallback: React.createElement(FullScreenLoader) },
            React.createElement(
              LegalStack.Navigator as any,
              {
                initialRouteName: appScreen === "TermsConditions" ? "TermsConditions" : "PrivacyPolicy",
                screenOptions: { headerShown: false },
              },
              React.createElement(LegalStack.Screen, { name: "PrivacyPolicy", component: PrivacyPolicyScreen as any }),
              React.createElement(LegalStack.Screen, { name: "TermsConditions", component: TermsConditionsScreen as any }),
            ),
          );
        },
      }),
    ),
  );
}
