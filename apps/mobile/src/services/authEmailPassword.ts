import { getSafeAuthErrorMessage, isEmailNotConfirmedError, isInvalidCredentialsError } from "./authSecurity";
import { isUserVerified } from "./authProviders";
import { signOutToLogin } from "./authSession";
import { supabase } from "./supabase";
import { logAuthDebugEvent } from "./authDebug";
import { clearPendingEmailVerification } from "./emailVerificationRedirect";

type LoginScreenTag = "login_native" | "login_web";

type LoginSuccess = {
  status: "success";
};

type LoginUnverified = {
  status: "unverified";
};

type LoginFailure = {
  status: "error";
  message: string;
  invalidCredentials: boolean;
};

type LoginResult = LoginSuccess | LoginUnverified | LoginFailure;

export async function signInWithEmailPassword({
  email,
  password,
  screen,
  fallbackMessage,
}: {
  email: string;
  password: string;
  screen: LoginScreenTag;
  fallbackMessage: string;
}): Promise<LoginResult> {
  logAuthDebugEvent("info", "email_password_login_attempt", {
    screen,
    emailDomain: email.split("@")[1] ?? null,
    href: typeof window !== "undefined" ? window.location.href : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  logAuthDebugEvent(error ? "warn" : "info", "email_password_login_result", {
    screen,
    emailDomain: email.split("@")[1] ?? null,
    ok: !error,
    error: error?.message ?? null,
    hasSession: Boolean(data.session),
    userId: data.user?.id ?? null,
  });

  if (error) {
    if (isEmailNotConfirmedError(error.message)) {
      return { status: "unverified" };
    }

    return {
      status: "error",
      message: getSafeAuthErrorMessage(error.message, fallbackMessage),
      invalidCredentials: isInvalidCredentialsError(error.message),
    };
  }

  if (!isUserVerified(data.user)) {
    await signOutToLogin();
    return { status: "unverified" };
  }

  await clearPendingEmailVerification();

  logAuthDebugEvent("info", "email_password_login_verified", {
    screen,
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
  });

  return { status: "success" };
}
