import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/App/HomeScreen";
import AudioPlayerScreen from "../screens/App/AudioPlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import type { AppStackParamList } from "./types";
import { colors, spacing, typography } from "../theme/tokens";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "./BottomNav";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.bg, height: 32 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => <Text style={styles.headerLeftText}>Lumepo</Text>,
          headerRight: ({ tintColor }) => (
            <Pressable
              onPress={() => navigation.navigate("Account")}
              hitSlop={8}
              style={styles.headerRight}
            >
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={22}
                color={tintColor ?? colors.text}
              />
            </Pressable>
          ),
        })}
      >
        {(props) => <HomeScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Player" options={{ title: "Sesi" }}>
        {(props) => (
          <ScreenWithBottomNav routeName={props.route.name} navigation={props.navigation}>
            <AudioPlayerScreen {...props} />
          </ScreenWithBottomNav>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Account"
        options={({ navigation }) => ({
          title: "Akun",
          headerLeft: ({ tintColor }) => (
            <Pressable
              onPress={() => navigation.navigate("Home")}
              hitSlop={8}
              style={styles.headerLeft}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={tintColor ?? colors.text}
              />
            </Pressable>
          ),
        })}
      >
        {(props) => (
          <ScreenWithBottomNav routeName={props.route.name} navigation={props.navigation}>
            <AccountScreen {...props} />
          </ScreenWithBottomNav>
        )}
      </Stack.Screen>

      <Stack.Screen name="ResetPassword" options={{ title: "Ubah kata sandi" }}>
        {(props) => (
          <ScreenWithBottomNav routeName={props.route.name} navigation={props.navigation}>
            <ResetPasswordScreen {...props} />
          </ScreenWithBottomNav>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  headerLeftText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
  headerLeft: {
    paddingHorizontal: spacing.xs,
  },
  headerRight: {
    paddingHorizontal: spacing.xs,
  },
});

type BottomNavWrapperProps = {
  children: React.ReactNode;
  navigation: React.ComponentProps<typeof BottomNav>["navigation"];
  routeName: string;
};

function ScreenWithBottomNav({ children, navigation, routeName }: BottomNavWrapperProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingBottom: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, spacing.xs) },
        ]}
      >
        {children}
      </View>
      <BottomNav navigation={navigation} routeName={routeName} />
    </View>
  );
}
