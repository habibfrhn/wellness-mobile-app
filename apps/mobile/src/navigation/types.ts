import type { AudioId } from "../content/audioCatalog";

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: { initialEmail?: string } | undefined;
  Login: { initialEmail?: string } | undefined;
  VerifyEmail: { email: string };
  ForgotPassword: { initialEmail?: string } | undefined;
  ResetPassword: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Player: { audioId: AudioId };
};

export type BreathingStackParamList = {
  Breathing: undefined;
};

export type AccountStackParamList = {
  Account: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  BreathingTab: undefined;
  AccountTab: undefined;
};
