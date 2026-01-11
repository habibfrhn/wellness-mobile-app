import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

async function read(file) {
  return readFile(path.join(repoRoot, file), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkSupabaseConfig() {
  const config = await read("supabase/config.toml");
  assert(config.includes("enable_confirmations = true"), "Auth confirmations are not enabled in supabase/config.toml");
  assert(
    config.includes("additional_redirect_urls"),
    "Missing additional_redirect_urls in supabase/config.toml"
  );
  assert(
    config.includes("wellnessapp://auth/callback"),
    "additional_redirect_urls must include wellnessapp://auth/callback"
  );
  assert(
    config.includes("wellnessapp://auth/reset"),
    "additional_redirect_urls must include wellnessapp://auth/reset"
  );
}

async function checkAuthLinks() {
  const source = await read("apps/mobile/src/services/authLinks.ts");
  assert(source.includes("auth/callback"), "authLinks.ts should handle auth/callback");
  assert(source.includes("auth/reset"), "authLinks.ts should handle auth/reset");
  assert(
    source.includes("exchangeCodeForSession"),
    "authLinks.ts should exchange code for session"
  );
}

async function checkAuthScreens() {
  const signUp = await read("apps/mobile/src/screens/Auth/SignUpScreen.tsx");
  assert(signUp.includes("AUTH_CALLBACK"), "SignUpScreen should use AUTH_CALLBACK");

  const login = await read("apps/mobile/src/screens/Auth/LoginScreen.tsx");
  assert(
    login.includes("VerifyEmail"),
    "LoginScreen should route unverified users to VerifyEmail"
  );
  assert(login.includes("showPassword"), "LoginScreen should include password visibility toggle");

  const forgot = await read("apps/mobile/src/screens/Auth/ForgotPasswordScreen.tsx");
  assert(forgot.includes("AUTH_RESET"), "ForgotPasswordScreen should use AUTH_RESET");

  const reset = await read("apps/mobile/src/screens/Auth/ResetPasswordScreen.tsx");
  assert(reset.includes("updateUser"), "ResetPasswordScreen should update the user password");
  assert(reset.includes("signOut"), "ResetPasswordScreen should sign out after password change");

  const verify = await read("apps/mobile/src/screens/Auth/VerifyEmailScreen.tsx");
  assert(verify.includes("resend"), "VerifyEmailScreen should support resend");
  assert(verify.includes("type: \"signup\""), "VerifyEmailScreen should resend signup emails");
}

async function checkAppGate() {
  const app = await read("apps/mobile/App.tsx");
  assert(
    app.includes("email_confirmed_at"),
    "App.tsx should gate sessions based on email_confirmed_at"
  );
  assert(app.includes("handleAuthLink"), "App.tsx should process auth links");
}

async function main() {
  await checkSupabaseConfig();
  await checkAuthLinks();
  await checkAuthScreens();
  await checkAppGate();

  console.log("✅ Auth smoke checks passed.");
}

main().catch((error) => {
  console.error("❌ Auth smoke checks failed.");
  console.error(error.message);
  process.exit(1);
});
