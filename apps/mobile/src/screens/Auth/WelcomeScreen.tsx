import React from "react";
import { View, Text, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { id } from "../../i18n/strings";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <AuthScreenLayout title={id.welcome.title} subtitle={id.welcome.subtitle}>
      <View style={authSharedStyles.actionsStack}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [authSharedStyles.primaryButton, pressed && authSharedStyles.pressed]}
        >
          <Text style={authSharedStyles.primaryButtonText}>{id.welcome.primaryCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [authSharedStyles.secondaryButton, pressed && authSharedStyles.pressed]}
        >
          <Text style={authSharedStyles.secondaryButtonText}>{id.welcome.secondaryCta}</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
