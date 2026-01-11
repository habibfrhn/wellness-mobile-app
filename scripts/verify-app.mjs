import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const requiredFiles = [
  "apps/mobile/App.tsx",
  "apps/mobile/src/screens/App/HomeScreen.tsx",
  "apps/mobile/src/screens/App/PlayerScreen.tsx",
  "apps/mobile/src/screens/App/AccountScreen.tsx",
  "apps/mobile/src/screens/Auth/WelcomeScreen.tsx",
  "apps/mobile/src/screens/Auth/SignUpScreen.tsx",
  "apps/mobile/src/screens/Auth/LoginScreen.tsx",
  "apps/mobile/src/screens/Auth/VerifyEmailScreen.tsx",
  "apps/mobile/src/screens/Auth/ForgotPasswordScreen.tsx",
  "apps/mobile/src/screens/Auth/ResetPasswordScreen.tsx",
  "apps/mobile/src/content/audioCatalog.ts",
  "apps/mobile/src/i18n/strings.ts",
  "apps/mobile/src/services/supabase.ts",
];

async function ensureFileExists(file) {
  const fullPath = path.join(repoRoot, file);
  try {
    await access(fullPath);
  } catch {
    throw new Error(`Missing required file: ${file}`);
  }
}

async function checkAudioCatalog() {
  const catalogPath = path.join(repoRoot, "apps/mobile/src/content/audioCatalog.ts");
  const source = await readFile(catalogPath, "utf8");

  const idMatches = [...source.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  const assetMatches = [...source.matchAll(/asset:\s*require\("([^"]+)"\)/g)].map((m) => m[1]);

  if (idMatches.length === 0) throw new Error("No audio track ids found in audioCatalog.ts");
  if (assetMatches.length === 0) throw new Error("No audio assets found in audioCatalog.ts");
  if (idMatches.length !== assetMatches.length) {
    throw new Error(`Audio ids (${idMatches.length}) do not match assets (${assetMatches.length}).`);
  }

  const uniqueIds = new Set(idMatches);
  if (uniqueIds.size !== idMatches.length) {
    throw new Error("Duplicate audio ids found in audioCatalog.ts");
  }

  await Promise.all(
    assetMatches.map(async (assetPath) => {
      const fullAssetPath = path.join(repoRoot, "apps/mobile/src/content", assetPath);
      try {
        await access(fullAssetPath);
      } catch {
        throw new Error(`Missing audio asset: ${assetPath}`);
      }
    })
  );
}

async function checkStrings() {
  const stringsPath = path.join(repoRoot, "apps/mobile/src/i18n/strings.ts");
  const source = await readFile(stringsPath, "utf8");

  const requiredKeys = [
    "home:",
    "player:",
    "account:",
    "welcome:",
    "signup:",
    "login:",
    "verify:",
    "forgot:",
    "reset:",
  ];

  for (const key of requiredKeys) {
    if (!source.includes(key)) {
      throw new Error(`Missing strings section: ${key.replace(":", "")}`);
    }
  }
}

async function checkSupabaseConstants() {
  const supabasePath = path.join(repoRoot, "apps/mobile/src/services/supabase.ts");
  const source = await readFile(supabasePath, "utf8");

  if (!source.includes("AUTH_CALLBACK")) {
    throw new Error("Missing AUTH_CALLBACK export in supabase.ts");
  }
  if (!source.includes("AUTH_RESET")) {
    throw new Error("Missing AUTH_RESET export in supabase.ts");
  }
}

async function main() {
  for (const file of requiredFiles) {
    await ensureFileExists(file);
  }

  await checkAudioCatalog();
  await checkStrings();
  await checkSupabaseConstants();

  console.log("✅ App smoke checks passed.");
}

main().catch((error) => {
  console.error("❌ App smoke checks failed.");
  console.error(error.message);
  process.exit(1);
});
