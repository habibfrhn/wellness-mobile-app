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
  Home:
    | undefined
    | {
        completed: true;
        stressBefore: number;
        stressAfter: number;
      };
  NightMode: undefined;
  NightCheckIn: { mode: "calm_mind" | "release_accept" };
  NightStep1: { mode: "calm_mind" | "release_accept"; stressBefore: number };
  NightStep2: { mode: "calm_mind" | "release_accept"; stressBefore: number };
  NightStep3: { mode: "calm_mind" | "release_accept"; stressBefore: number };
  NightCheckOut: { mode: "calm_mind" | "release_accept"; stressBefore: number };
  Player: { audioId: AudioId };
  Account: undefined;
  Settings: undefined;
  ReminderSettings: undefined;
  ResetPassword: undefined;
};
