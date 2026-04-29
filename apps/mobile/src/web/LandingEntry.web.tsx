import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AppStackParamList, AuthStackParamList } from "../navigation/types";
import AuthStack from "../navigation/AuthStack";
import LandingScreen from "../screens/LandingScreen";

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
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
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

  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Landing" component={LandingScreen} />
        <RootStack.Screen name="Auth">
          {({ route }) => {
            const requestedRoute = route.params?.screen;
            const resolvedInitialRoute =
              requestedRoute === "Login" || requestedRoute === "SignUp" || requestedRoute === "ResetPassword"
                ? requestedRoute
                : "Login";

            return (
              <Suspense fallback={<FullScreenLoader />}>
                <AuthStack initialRouteName={resolvedInitialRoute} includeWelcome={false} />
              </Suspense>
            );
          }}
        </RootStack.Screen>
        <RootStack.Screen name="App">
          {({ route }) => {
            const appScreen = route.params?.screen;

            return (
              <Suspense fallback={<FullScreenLoader />}>
                <LegalStack.Navigator
                  initialRouteName={appScreen === "TermsConditions" ? "TermsConditions" : "PrivacyPolicy"}
                  screenOptions={{ headerShown: false }}
                >
                  <LegalStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                  <LegalStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
                </LegalStack.Navigator>
              </Suspense>
            );
          }}
        </RootStack.Screen>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
