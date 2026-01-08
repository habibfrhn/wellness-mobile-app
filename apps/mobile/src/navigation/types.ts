import type { AudioId } from "../content/audioCatalog";

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: { initialEmail?: string } | undefined;
  Login: { initialEmail?: string } | undefined;
  VerifyEmail: { email: string };
  ForgotPassword: { initialEmail?: string } | undefined;
  ResetPassword: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Player: { audioId: AudioId; resume?: boolean };
  Account: undefined;
};
