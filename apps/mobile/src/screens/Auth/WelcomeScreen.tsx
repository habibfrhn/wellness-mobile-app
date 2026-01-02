import React from "react";
import { View, Text, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "600" }}>Wellness</Text>
      <Text style={{ opacity: 0.7 }}>
        Verify once. Then you can play tonight.
      </Text>

      <Pressable
        onPress={() => navigation.navigate("SignUp")}
        style={{ padding: 14, backgroundColor: "black", borderRadius: 10 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          Sign up to start tonight
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Login")}
        style={{ padding: 14, borderWidth: 1, borderRadius: 10 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "600" }}>Log in</Text>
      </Pressable>
    </View>
  );
}
