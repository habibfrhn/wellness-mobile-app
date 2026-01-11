import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(file) {
  return readFile(path.join(repoRoot, file), "utf8");
}

async function main() {
  const account = await read("apps/mobile/src/screens/App/AccountScreen.tsx");
  assert(account.includes("resetPasswordForEmail"), "AccountScreen should trigger resetPasswordForEmail");
  assert(account.includes("AUTH_RESET"), "AccountScreen should use AUTH_RESET for reset link");
  assert(account.includes("resetPassword"), "AccountScreen should reference resetPassword copy");

  const strings = await read("apps/mobile/src/i18n/strings.ts");
  assert(strings.includes("resetPassword:"), "strings.ts should include account.resetPassword label");
  assert(strings.includes("resetPasswordBody:"), "strings.ts should include account.resetPasswordBody");

  console.log("✅ Reset password checks passed.");
}

main().catch((error) => {
  console.error("❌ Reset password checks failed.");
  console.error(error.message);
  process.exit(1);
});
