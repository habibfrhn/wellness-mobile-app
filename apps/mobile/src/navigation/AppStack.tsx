import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "./types";

import HomeScreen from "../screens/App/HomeScreen";
import PlayerScreen from "../screens/App/PlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import { colors, typography, spacing } from "../theme/tokens";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Beranda",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Account")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                paddingHorizontal: spacing.sm,
              })}
              hitSlop={10}
            >
              <Text style={{ color: colors.text, fontSize: typography.small, fontWeight: "700" }}>
                Akun
              </Text>
            </Pressable>
          ),
        })}
      />

      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          // Player already provides its own header row (Kembali + Timer).
          // Hide native header to keep UX clean.
          headerShown: false,
        }}
      />

      <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Akun" }} />
    </Stack.Navigator>
  );
}
