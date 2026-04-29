import { supabase } from "./supabase";
import { logAuthDebugEvent } from "./authDebug";
import { isUserVerified } from "./authProviders";

export type EmailPasswordSignInResult =
  | { status: "ok"; email: string }
  | { status: "unverified"; email: string }
  | { status: "error"; email: string; message: string };

export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
  screen: "login_web" | "login_native";
}): Promise<EmailPasswordSignInResult> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: params.password,
  });

  logAuthDebugEvent(error ? "warn" : "info", "email_password_login_result", {
    screen: params.screen,
    emailDomain: normalizedEmail.split("@")[1] ?? null,
    ok: !error,
    error: error?.message ?? null,
    hasSession: Boolean(data.session),
    userId: data.user?.id ?? null,
  });

  if (error) {
    return {
      status: "error",
      email: normalizedEmail,
      message: error.message,
    };
  }

  if (!data.session || !data.user || !isUserVerified(data.user)) {
    return {
      status: "unverified",
      email: normalizedEmail,
    };
  }

  return {
    status: "ok",
    email: normalizedEmail,
  };
}
