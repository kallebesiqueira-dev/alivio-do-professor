import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:3000";
const MAX_CHUNK_SIZE = 3180;

function readEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = readEnv();
const EMAIL = process.env.SCREENSHOT_EMAIL || env.SCREENSHOT_EMAIL || "";
const PASSWORD = process.env.SCREENSHOT_PASSWORD || env.SCREENSHOT_PASSWORD || "";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Replicates @supabase/ssr createChunks logic
function createChunks(key, value) {
  const encoded = encodeURIComponent(value);
  if (encoded.length <= MAX_CHUNK_SIZE) {
    return [{ name: key, value }];
  }
  const chunks = [];
  let remaining = encoded;
  while (remaining.length > 0) {
    let head = remaining.slice(0, MAX_CHUNK_SIZE);
    const lastPct = head.lastIndexOf("%");
    if (lastPct > MAX_CHUNK_SIZE - 3) head = head.slice(0, lastPct);
    let decoded = "";
    while (head.length > 0) {
      try { decoded = decodeURIComponent(head); break; } catch {
        head = head.slice(0, head.length - 3);
      }
    }
    chunks.push(decoded);
    remaining = remaining.slice(encodeURIComponent(decoded).length);
  }
  return chunks.map((chunk, i) => ({ name: `${key}.${i}`, value: chunk }));
}

const PUBLIC_PAGES = [
  { name: "landing", path: "/", waitFor: "h1" },
  { name: "login", path: "/login", waitFor: "form" },
];

const AUTH_PAGES = [
  { name: "dashboard", path: "/dashboard", waitFor: "main" },
  { name: "upload", path: "/upload", waitFor: "main" },
  { name: "corrections", path: "/corrections", waitFor: "main" },
  { name: "planner", path: "/planner", waitFor: "main" },
  { name: "reports", path: "/reports", waitFor: "section" },
  { name: "trash", path: "/trash", waitFor: "section" },
  { name: "account", path: "/account", waitFor: "section" },
];

async function snap(page, name, pagePath, waitFor) {
  console.log(`  Capturing ${name}…`);
  try {
    await page.goto(BASE + pagePath, { waitUntil: "networkidle2", timeout: 25000 });
    await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    console.log(`  ✓ ${name}.png`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function main() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  // ── Public pages ──────────────────────────────────────────────────────────
  console.log("\n── Páginas públicas ──");
  const pubPage = await browser.newPage();
  await pubPage.setViewport({ width: 1280, height: 800 });
  for (const { name, path: p, waitFor } of PUBLIC_PAGES) {
    await snap(pubPage, name, p, waitFor);
  }
  await pubPage.close();

  // ── Authenticated pages ───────────────────────────────────────────────────
  if (!EMAIL || !PASSWORD) {
    console.log("\n⚠  SCREENSHOT_EMAIL e SCREENSHOT_PASSWORD não definidos.");
    await browser.close();
    return;
  }

  // Sign in via Supabase REST API
  console.log(`\n── Login via API como ${EMAIL} ──`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const session = await res.json();
  console.log("  ✓ Token obtido.");

  // Build cookies in @supabase/ssr chunk format
  const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)/)?.[1] ?? "supabase";
  const cookieKey = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify(session);
  const cookieChunks = createChunks(cookieKey, sessionJson);

  const authPage = await browser.newPage();
  await authPage.setViewport({ width: 1280, height: 800 });
  // Visit app first to establish the domain context
  await authPage.goto(BASE, { waitUntil: "domcontentloaded", timeout: 15000 });

  await authPage.setCookie(
    ...cookieChunks.map(({ name, value }) => ({
      name,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    })),
  );

  // Verify auth
  await authPage.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2", timeout: 20000 });
  const url = authPage.url();
  console.log(`  url: ${url}`);

  if (url.includes("/login")) {
    console.error("  ✗ Cookies não reconhecidos — verifique credenciais.");
    await browser.close();
    process.exit(1);
  }
  console.log("  ✓ Autenticado.\n── Páginas autenticadas ──");

  for (const { name, path: p, waitFor } of AUTH_PAGES) {
    await snap(authPage, name, p, waitFor);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((err) => { console.error(err); process.exit(1); });
