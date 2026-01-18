import React from "react";
import { Pressable, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "./types";

import HomeScreen from "../screens/App/HomeScreen";
import PlayerScreen from "../screens/App/PlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import { colors, typography, spacing } from "../theme/tokens";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.bg, height: 44 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => <Text style={styles.headerLeftText}>Lumepo</Text>,
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Account")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                paddingHorizontal: spacing.xs,
              })}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        })}
      />

      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ title: "Sesi" }}
      />

      <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Akun" }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Ubah kata sandi" }} />
    </Stack.Navigator>
  );
}

const styles = {
  headerLeftText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    paddingHorizontal: spacing.xs,
  },
};
