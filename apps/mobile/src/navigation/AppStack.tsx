import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppStackParamList } from "./types";
import HomeScreen from "../screens/App/HomeScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Beranda" }} />
    </Stack.Navigator>
  );
}
