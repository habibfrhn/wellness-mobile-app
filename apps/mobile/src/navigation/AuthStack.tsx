import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import SignUpScreen from "../screens/Auth/SignUpScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import VerifyEmailScreen from "../screens/Auth/VerifyEmailScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: "" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Daftar" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Masuk" }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Verifikasi email" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Lupa kata sandi" }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Atur ulang kata sandi" }} />
    </Stack.Navigator>
  );
}
