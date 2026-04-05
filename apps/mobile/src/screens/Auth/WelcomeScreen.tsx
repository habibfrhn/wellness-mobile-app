import React from "react";
import { View, Text, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { id } from "../../i18n/strings";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <AuthScreenLayout title={id.welcome.title} subtitle={id.welcome.subtitle} showCloseButton={false}>
      <View style={authSharedStyles.actionsStack}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ hovered, pressed }: any) => [
            authSharedStyles.primaryButton,
            hovered && authSharedStyles.primaryButtonHover,
            pressed && authSharedStyles.primaryButtonPressed,
          ]}
        >
          <Text style={authSharedStyles.primaryButtonText}>{id.welcome.primaryCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ hovered, pressed }: any) => [
            authSharedStyles.secondaryButton,
            hovered && authSharedStyles.secondaryButtonHover,
            pressed && authSharedStyles.secondaryButtonPressed,
          ]}
        >
          {({ hovered, pressed }: any) => (
            <Text
              style={[
                authSharedStyles.secondaryButtonText,
                hovered && authSharedStyles.secondaryButtonHoverText,
                pressed && authSharedStyles.secondaryButtonPressedText,
              ]}
            >
              {id.welcome.secondaryCta}
            </Text>
          )}
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
