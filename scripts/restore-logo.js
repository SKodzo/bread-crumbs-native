const puppeteer = require("puppeteer");
const path = require("path");

const ASSETS = path.join(__dirname, "../assets");

// Recreate the official logo: bread-shaped "B", green border, bread texture, crumbs
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1377px;height:768px;overflow:hidden;background:transparent;}
.canvas{
  width:1377px;height:768px;
  background:#fff;
  display:flex;align-items:center;justify-content:center;
  position:relative;
}
svg{width:1100px;height:700px;}
</style>
</head>
<body>
<div class="canvas">
<svg viewBox="0 0 1100 700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Bread texture gradient -->
    <radialGradient id="breadFill" cx="42%" cy="38%" r="62%">
      <stop offset="0%"   stop-color="#FAF5E8"/>
      <stop offset="35%"  stop-color="#F2E8C8"/>
      <stop offset="75%"  stop-color="#E8D8A8"/>
      <stop offset="100%" stop-color="#D8C080"/>
    </radialGradient>
    <!-- Noise/texture filter for bread surface -->
    <filter id="texture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend"/>
      <feComposite in="blend" in2="SourceGraphic" operator="in"/>
    </filter>
    <!-- Drop shadow for bread -->
    <filter id="breadShadow" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="8" stdDeviation="18" flood-color="#8B6914" flood-opacity="0.3"/>
    </filter>
    <!-- Inner glow/highlight -->
    <radialGradient id="highlight" cx="38%" cy="28%" r="40%">
      <stop offset="0%"   stop-color="#fff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- ── BREAD "B" SHAPE ── -->
  <!-- The B shape path: outer contour of the letter B in bread form -->
  <!-- Using a stylized chunky B shape with rounded edges like bread -->
  <g filter="url(#breadShadow)">
    <!-- Main bread body (thick chunky B) -->
    <path d="
      M 160,80
      C 160,80 160,50 190,44
      L 560,44
      C 640,44 720,60 780,110
      C 840,158 870,222 870,296
      C 870,346 852,390 820,424
      C 800,444 776,458 748,468
      C 792,488 826,516 852,554
      C 880,594 895,642 895,696
      C 895,770 868,834 814,882
      C 758,932 682,958 586,958
      L 190,958
      C 173,958 160,944 160,926
      Z
    " fill="url(#breadFill)" filter="url(#texture)"/>

    <!-- Upper bump of B -->
    <path d="
      M 290,100
      L 560,100
      C 618,100 668,118 704,152
      C 740,186 758,232 758,288
      C 758,344 740,388 704,420
      C 668,452 618,468 560,468
      L 290,468
      Z
    " fill="url(#breadFill)" filter="url(#texture)"/>

    <!-- Lower bump of B (slightly wider) -->
    <path d="
      M 290,500
      L 590,500
      C 658,500 714,520 756,560
      C 798,600 820,652 820,716
      C 820,780 798,832 756,868
      C 714,904 658,922 590,922
      L 290,922
      Z
    " fill="url(#breadFill)" filter="url(#texture)"/>
  </g>

  <!-- Highlight overlay on bread surface -->
  <path d="
    M 160,80 C 160,50 190,44 190,44 L 560,44
    C 640,44 720,60 780,110 C 840,158 870,222 870,296
    C 870,346 852,390 820,424 C 800,444 776,458 748,468
    C 792,488 826,516 852,554 C 880,594 895,642 895,696
    C 895,770 868,834 814,882 C 758,932 682,958 586,958
    L 190,958 C 173,958 160,944 160,926 Z
  " fill="url(#highlight)"/>

  <!-- Surface texture dots (air pockets in bread) -->
  <circle cx="420" cy="180" r="14" fill="#D4BC7A" opacity="0.5"/>
  <circle cx="480" cy="210" r="10" fill="#C8AE6A" opacity="0.4"/>
  <circle cx="350" cy="230" r="8"  fill="#D4BC7A" opacity="0.35"/>
  <circle cx="560" cy="160" r="11" fill="#C8AE6A" opacity="0.4"/>
  <circle cx="650" cy="200" r="9"  fill="#D4BC7A" opacity="0.35"/>
  <circle cx="400" cy="620" r="16" fill="#D4BC7A" opacity="0.5"/>
  <circle cx="500" cy="660" r="12" fill="#C8AE6A" opacity="0.4"/>
  <circle cx="620" cy="590" r="10" fill="#D4BC7A" opacity="0.35"/>
  <circle cx="680" cy="650" r="8"  fill="#C8AE6A" opacity="0.4"/>
  <circle cx="360" cy="700" r="9"  fill="#D4BC7A" opacity="0.35"/>

  <!-- ── GREEN BORDER ── -->
  <!-- The green outline border around the B shape -->
  <path d="
    M 160,80
    C 160,80 160,50 190,44
    L 560,44
    C 640,44 720,60 780,110
    C 840,158 870,222 870,296
    C 870,346 852,390 820,424
    C 800,444 776,458 748,468
    C 792,488 826,516 852,554
    C 880,594 895,642 895,696
    C 895,770 868,834 814,882
    C 758,932 682,958 586,958
    L 190,958
    C 173,958 160,944 160,926
    Z
  " fill="none" stroke="#1B6B44" stroke-width="28" stroke-linejoin="round"/>

  <!-- Upper hole of B (negative space) - white -->
  <path d="
    M 300,108
    L 558,108
    C 610,108 654,124 686,154
    C 718,184 734,226 734,280
    C 734,334 718,374 686,402
    C 654,430 610,444 558,444
    L 300,444
    Z
  " fill="#fff"/>

  <!-- Lower hole of B (negative space) - white, slightly wider -->
  <path d="
    M 300,508
    L 588,508
    C 648,508 698,526 734,562
    C 770,596 788,642 788,706
    C 788,770 770,816 734,850
    C 698,884 648,900 588,900
    L 300,900
    Z
  " fill="#fff"/>

  <!-- ── BITE MARK at bottom left of B ── -->
  <path d="
    M 230,870 Q 240,840 260,830 Q 245,860 250,880 Q 245,900 230,910 Q 220,900 230,870 Z
  " fill="#fff"/>
  <path d="
    M 195,880 Q 210,860 228,868 Q 215,888 218,908 Q 210,920 195,912 Q 188,900 195,880 Z
  " fill="#fff"/>
  <path d="
    M 162,890 Q 176,874 192,880 Q 180,898 181,916 Q 175,928 162,922 Q 155,910 162,890 Z
  " fill="#fff"/>
  <!-- Bite indent on the border -->
  <path d="M 155,910 Q 160,875 185,865 Q 210,855 235,870 Q 250,855 268,845 Q 255,920 255,940 L 165,940 Z"
    fill="none" stroke="#1B6B44" stroke-width="20" stroke-linejoin="round" opacity="0.6"/>

  <!-- ── CRUMBS at bottom ── -->
  <!-- Scattered crumb pieces below the bite -->
  <g opacity="0.85">
    <!-- Crumb 1 - larger irregular -->
    <path d="M 120,985 L 140,970 L 158,978 L 152,1000 L 130,1002 Z" fill="#E8C878" stroke="#C8A050" stroke-width="2"/>
    <!-- Crumb 2 -->
    <path d="M 168,1010 L 182,998 L 196,1004 L 190,1022 L 172,1020 Z" fill="#D8B860" stroke="#B89840" stroke-width="2"/>
    <!-- Crumb 3 - small -->
    <path d="M 210,990 L 220,982 L 228,988 L 224,1000 L 212,998 Z" fill="#E8C878" stroke="#C8A050" stroke-width="2"/>
    <!-- Crumb 4 - tiny -->
    <ellipse cx="248" cy="1015" rx="9" ry="7" fill="#D4B460" stroke="#B49040" stroke-width="1.5" transform="rotate(-20,248,1015)"/>
    <!-- Crumb 5 -->
    <path d="M 85,1010 L 100,998 L 110,1006 L 105,1022 L 88,1018 Z" fill="#E0C070" stroke="#C0A048" stroke-width="2"/>
    <!-- Crumb 6 - medium -->
    <path d="M 278,1000 L 292,990 L 300,998 L 295,1012 L 280,1010 Z" fill="#D8B860" stroke="#B89840" stroke-width="2"/>
    <!-- Crumb 7 - tiny scatter -->
    <circle cx="148" cy="1030" r="6" fill="#D4B460" stroke="#B49040" stroke-width="1.5"/>
    <circle cx="230" cy="1028" r="5" fill="#E0C070" stroke="#C0A048" stroke-width="1.5"/>
    <circle cx="188" cy="1038" r="4" fill="#D4B460" stroke="#B49040" stroke-width="1"/>
    <circle cx="262" cy="1024" r="5" fill="#E0C070" stroke="#C0A048" stroke-width="1.5"/>
    <circle cx="105" cy="1035" r="4" fill="#D4B460" stroke="#B49040" stroke-width="1"/>
  </g>

</svg>
</div>
</body>
</html>`;

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  // Match the original logo dimensions: 1377×768
  await page.setViewport({ width: 1377, height: 1060, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: require("path").join(ASSETS, "logo.png"),
    clip: { x: 0, y: 0, width: 1377, height: 768 },
    omitBackground: false,
  });
  await browser.close();
  console.log("✓ logo.png restored (1377×768)");
}

main().catch(err => { console.error(err); process.exit(1); });
