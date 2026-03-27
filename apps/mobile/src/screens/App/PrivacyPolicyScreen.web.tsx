import React, { useLayoutEffect } from "react";
import { NavigationProp, NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import LandingContextHeader from "../../components/landing/LandingContextHeader";
import PrivacyPolicyContent from "../../components/privacy/PrivacyPolicyContent";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import type { AppStackParamList, AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "PrivacyPolicy">;
type RootStackParamList = {
  Landing: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  App: NavigatorScreenParams<AppStackParamList> | undefined;
};

export default function PrivacyPolicyScreen({ navigation, route }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const isDesktop = webViewport === "desktop";
  const isTablet = webViewport === "tablet";
  const isLandingEntry = route.params?.entryPoint === "landing";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerStyle: { backgroundColor: colors.bg },
      headerShown: !isLandingEntry,
    });
  }, [isLandingEntry, navigation]);

  const goToLanding = () => {
    rootNavigation.navigate("Landing");
  };

  const goToLogin = () => {
    rootNavigation.navigate("Auth", { screen: "Login" });
  };

  const goToSignUp = () => {
    rootNavigation.navigate("Auth", { screen: "SignUp" });
  };

  const goToTerms = () => {
    rootNavigation.navigate("App", {
      screen: "TermsConditions",
      params: { entryPoint: "landing" },
    });
  };

  return (
    <>
      {isLandingEntry ? (
        <LandingContextHeader
          activeItem="privacy-policy"
          isDesktop={isDesktop}
          isTablet={isTablet}
          onPressHome={goToLanding}
          onPressFaq={goToLanding}
          onPressPrivacyPolicy={() => {}}
          onPressTermsConditions={goToTerms}
          onPressLogin={goToLogin}
          onPressSignUp={goToSignUp}
        />
      ) : null}
      <WebResponsiveFrame disableFrame>
        <PrivacyPolicyContent />
      </WebResponsiveFrame>
    </>
  );
}
