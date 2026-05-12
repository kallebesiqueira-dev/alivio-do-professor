import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "screenshots");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:3000";

const PAGES = [
  { name: "landing", path: "/", waitFor: "h1" },
  { name: "login", path: "/login", waitFor: "form" },
  { name: "dashboard", path: "/dashboard", waitFor: "main" },
  { name: "upload", path: "/upload", waitFor: "main" },
  { name: "corrections", path: "/corrections", waitFor: "main" },
  { name: "planner", path: "/planner", waitFor: "main" },
  { name: "trash", path: "/trash", waitFor: "main" },
];

async function main() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const { name, path: pagePath, waitFor } of PAGES) {
    const url = BASE + pagePath;
    console.log(`Capturing ${name}…`);
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      await page.waitForSelector(waitFor, { timeout: 5000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({
        path: path.join(OUT, `${name}.png`),
        fullPage: false,
      });
      console.log(`  ✓ docs/screenshots/${name}.png`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
