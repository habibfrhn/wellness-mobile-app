import { serveDeleteAccount } from "../_shared/deleteAccountHandler.ts";

// Legacy alias retained for backwards compatibility. Prefer delete-account-v2.
serveDeleteAccount({
  functionName: "delete-user-account",
  acceptBodyJwt: false,
});
