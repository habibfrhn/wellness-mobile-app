import { serveDeleteAccount } from "../_shared/deleteAccountHandler.ts";

serveDeleteAccount({
  functionName: "delete-account-v2",
  acceptBodyJwt: true,
});
