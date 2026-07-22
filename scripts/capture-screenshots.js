const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const MOCKUPS = path.join(__dirname, "mockups");
const ASSETS  = path.join(__dirname, "../assets");

const SCREENS = [
  { file: "screen1.html", out: "screenshot-1-onboarding.png"    },
  { file: "screen2.html", out: "screenshot-2-dpa-programs.png"  },
  { file: "screen3.html", out: "screenshot-3-monthly-cost.png"  },
  { file: "screen4.html", out: "screenshot-4-action-plan.png"   },
  { file: "screen5.html", out: "screenshot-5-auth-screen.png"   },
];

async function main() {
  // Safety check — never overwrite the app logo
  const logoPath = path.join(ASSETS, "logo.png");
  if (!require("fs").existsSync(logoPath)) {
    console.error("ERROR: logo.png is missing! Run scripts/restore-logo.js first.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page    = await browser.newPage();

  await page.setViewport({ width: 1290, height: 2796, deviceScaleFactor: 2 });

  for (const { file, out } of SCREENS) {
    const url  = `file://${path.join(MOCKUPS, file)}`;
    const dest = path.join(ASSETS, out);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
    // Extra wait for web fonts
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: dest, clip: { x: 0, y: 0, width: 1290, height: 2796 } });
    console.log(`✓ ${out}`);
  }

  await browser.close();
  console.log("\nAll screenshots saved to: " + ASSETS);
}

main().catch(err => { console.error(err); process.exit(1); });
