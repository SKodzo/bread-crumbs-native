const puppeteer = require("puppeteer");
const path = require("path");

const ASSETS = path.join(__dirname, "../assets");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1024px;height:1024px;overflow:hidden;background:#1B6B44;}
.canvas{
  width:1024px;height:1024px;
  background:linear-gradient(145deg,#2E9660 0%,#1B6B44 45%,#0D4A2A 100%);
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
/* Subtle radial highlight */
.canvas::before{
  content:'';
  position:absolute;
  width:700px;height:700px;
  background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%);
  top:-100px;left:-100px;
  border-radius:50%;
}
/* Bread loaf container */
.bread{
  width:680px;height:520px;
  position:relative;
  display:flex;align-items:center;justify-content:center;
}
/* Loaf dome SVG */
svg{position:absolute;top:0;left:0;width:100%;height:100%;}
/* Big B letter */
.letter{
  position:relative;z-index:2;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
  font-size:340px;
  font-weight:900;
  color:#0D4A2A;
  letter-spacing:-10px;
  line-height:1;
  text-shadow:0 4px 24px rgba(0,0,0,0.15);
  margin-top:40px;
}
</style>
</head>
<body>
<div class="canvas">
  <!-- Bread loaf SVG shape behind the B -->
  <div class="bread">
    <svg viewBox="0 0 680 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="domeGrad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#F5E6C4"/>
          <stop offset="60%" stop-color="#E8C78A"/>
          <stop offset="100%" stop-color="#C8922A"/>
        </radialGradient>
        <radialGradient id="crustGrad" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stop-color="#D4924A"/>
          <stop offset="100%" stop-color="#9A5A10"/>
        </radialGradient>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>

      <!-- Bread bottom crust -->
      <ellipse cx="340" cy="460" rx="270" ry="58" fill="url(#crustGrad)" filter="url(#softShadow)"/>

      <!-- Main bread body rectangle -->
      <rect x="70" y="220" width="540" height="240" fill="url(#domeGrad)"/>

      <!-- Bread dome top -->
      <ellipse cx="340" cy="220" rx="270" ry="155" fill="url(#domeGrad)"/>

      <!-- Crust bottom overlap -->
      <ellipse cx="340" cy="460" rx="270" ry="42" fill="url(#crustGrad)" opacity="0.85"/>

      <!-- Side crust edges -->
      <rect x="70" y="360" width="20" height="100" fill="#B5711A" rx="3"/>
      <rect x="590" y="360" width="20" height="100" fill="#B5711A" rx="3"/>

      <!-- Score lines on dome -->
      <path d="M 200 160 Q 190 260 185 340" stroke="#C8922A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M 280 130 Q 268 240 264 340" stroke="#C8922A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M 340 120 Q 340 230 340 340" stroke="#C8922A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M 400 130 Q 412 240 416 340" stroke="#C8922A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M 480 160 Q 490 260 495 340" stroke="#C8922A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>

      <!-- Specular highlight on dome -->
      <ellipse cx="280" cy="170" rx="100" ry="55" fill="white" opacity="0.1"/>

      <!-- Crumb dots below -->
      <circle cx="160" cy="490" r="10" fill="#E8C78A" opacity="0.7"/>
      <circle cx="195" cy="505" r="7"  fill="#C8922A" opacity="0.5"/>
      <circle cx="490" cy="488" r="11" fill="#E8C78A" opacity="0.7"/>
      <circle cx="525" cy="506" r="8"  fill="#C8922A" opacity="0.5"/>
      <circle cx="340" cy="510" r="9"  fill="#E8C78A" opacity="0.6"/>
      <circle cx="270" cy="500" r="6"  fill="#C8922A" opacity="0.4"/>
      <circle cx="410" cy="502" r="7"  fill="#E8C78A" opacity="0.5"/>
    </svg>

    <div class="letter">B</div>
  </div>
</div>
</body>
</html>`;

async function main() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page    = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({
    path: require("path").join(ASSETS, "icon.png"),
    clip: { x: 0, y: 0, width: 1024, height: 1024 }
  });
  await browser.close();
  console.log("✓ icon.png (1024×1024 @ 2x → 2048px master)");
}

main().catch(err => { console.error(err); process.exit(1); });
