const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ASSETS = path.join(__dirname, "../assets");
fs.mkdirSync(ASSETS, { recursive: true });

// ─── COLORS ─────────────────────────────────────────────────────────────────
const G_DARK   = "#0D3D24";
const G_MID    = "#1B6B44";
const G_LIGHT  = "#2E9660";
const G_PALE   = "#4CAF7D";
const WHITE    = "#FFFFFF";
const OFF_W    = "#F7FAF8";
const AMBER    = "#F59E0B";
const BLUE     = "#3B82F6";
const TEXT     = "#0F2419";

// ─── LOGO (1024×1024) ───────────────────────────────────────────────────────
const logoSVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#2E9660"/>
      <stop offset="100%" stop-color="#0D3D24"/>
    </radialGradient>
    <radialGradient id="bread" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#F5E6C8"/>
      <stop offset="50%" stop-color="#E8C98A"/>
      <stop offset="100%" stop-color="#C8A055"/>
    </radialGradient>
    <radialGradient id="crust" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D4924A"/>
      <stop offset="100%" stop-color="#A0651A"/>
    </radialGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="512" cy="512" r="512" fill="url(#bg)"/>

  <!-- Outer ring / halo -->
  <circle cx="512" cy="512" r="440" fill="none" stroke="#4CAF7D" stroke-width="6" opacity="0.4"/>

  <!-- Bread loaf shape — main body -->
  <ellipse cx="512" cy="560" rx="290" ry="190" fill="url(#crust)"/>

  <!-- Bread top dome -->
  <ellipse cx="512" cy="430" rx="270" ry="170" fill="url(#bread)"/>

  <!-- Bread body fill (lower half) -->
  <rect x="222" y="430" width="580" height="190" fill="url(#bread)"/>

  <!-- Crust bottom band -->
  <ellipse cx="512" cy="620" rx="290" ry="50" fill="url(#crust)"/>

  <!-- Score lines on bread (decorative cuts) -->
  <line x1="350" y1="360" x2="330" y2="450" stroke="#C8A055" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <line x1="420" y1="320" x2="400" y2="430" stroke="#C8A055" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <line x1="512" y1="305" x2="512" y2="420" stroke="#C8A055" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <line x1="604" y1="320" x2="624" y2="430" stroke="#C8A055" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <line x1="674" y1="360" x2="694" y2="450" stroke="#C8A055" stroke-width="4" stroke-linecap="round" opacity="0.6"/>

  <!-- Letter B on the bread -->
  <text x="512" y="550" font-family="Georgia, serif" font-size="240" font-weight="900"
        fill="#1B6B44" text-anchor="middle" dominant-baseline="middle" opacity="0.92">B</text>

  <!-- Crumb dots scattered -->
  <circle cx="280" cy="680" r="7" fill="#E8C98A" opacity="0.7"/>
  <circle cx="310" cy="700" r="5" fill="#D4924A" opacity="0.6"/>
  <circle cx="740" cy="685" r="8" fill="#E8C98A" opacity="0.7"/>
  <circle cx="770" cy="705" r="5" fill="#D4924A" opacity="0.5"/>
  <circle cx="500" cy="710" r="6" fill="#E8C98A" opacity="0.6"/>
  <circle cx="530" cy="695" r="4" fill="#D4924A" opacity="0.5"/>
  <circle cx="400" cy="720" r="5" fill="#E8C98A" opacity="0.5"/>
  <circle cx="620" cy="715" r="6" fill="#D4924A" opacity="0.6"/>

  <!-- Subtle shine highlight on bread dome -->
  <ellipse cx="450" cy="370" rx="80" ry="45" fill="white" opacity="0.12"/>
</svg>`;

// ─── SCREENSHOT HELPER ──────────────────────────────────────────────────────
// W=1290 H=2796 (iPhone 16 Pro Max)

function phoneFrame(content, headline, subtitle, bgTop = G_DARK, bgBot = G_MID) {
  // Phone is 600×1100 centered at x=345, y=560 (in 1290×2796 canvas)
  const PX = 345, PY = 500, PW = 600, PH = 1200;
  const IR = 40; // inner radius
  return `<svg width="1290" height="2796" viewBox="0 0 1290 2796" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}"/>
      <stop offset="100%" stop-color="${bgBot}"/>
    </linearGradient>
    <clipPath id="phone-clip">
      <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="56"/>
    </clipPath>
    <filter id="shadow">
      <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1290" height="2796" fill="url(#bg)"/>

  <!-- Subtle grid overlay -->
  <line x1="0" y1="1398" x2="1290" y2="1398" stroke="white" stroke-width="1" opacity="0.04"/>
  <line x1="645" y1="0" x2="645" y2="2796" stroke="white" stroke-width="1" opacity="0.04"/>

  <!-- Decorative circles -->
  <circle cx="100" cy="200" r="300" fill="white" opacity="0.03"/>
  <circle cx="1200" cy="2600" r="400" fill="white" opacity="0.03"/>

  <!-- Headline text -->
  <text x="645" y="300" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="72" font-weight="800"
        fill="white" text-anchor="middle" dominant-baseline="middle">${headline}</text>
  <text x="645" y="400" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="40" font-weight="400"
        fill="#A8D5BC" text-anchor="middle" dominant-baseline="middle">${subtitle}</text>

  <!-- Phone outer shell (shadow + bezel) -->
  <rect x="${PX - 4}" y="${PY - 4}" width="${PW + 8}" height="${PH + 8}" rx="60"
        fill="#111" filter="url(#shadow)" opacity="0.6"/>

  <!-- Phone bezel -->
  <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="56" fill="#1a1a1a"/>

  <!-- Phone screen -->
  <rect x="${PX + 6}" y="${PY + 6}" width="${PW - 12}" height="${PH - 12}" rx="${IR}" fill="${OFF_W}"/>

  <!-- Screen content -->
  <g clip-path="url(#phone-clip)">
    <rect x="${PX + 6}" y="${PY + 6}" width="${PW - 12}" height="${PH - 12}" rx="${IR}" fill="${OFF_W}"/>
    ${content}
  </g>

  <!-- Notch / Dynamic Island -->
  <rect x="520" y="${PY + 14}" width="250" height="32" rx="16" fill="#1a1a1a"/>

  <!-- Bread Crumbs branding below phone -->
  <text x="645" y="${PY + PH + 80}" font-family="-apple-system,BlinkMacSystemFont,sans-serif"
        font-size="36" font-weight="700" fill="white" text-anchor="middle" opacity="0.6">🍞 Bread Crumbs</text>
</svg>`;
}

// ─── SCREENSHOT 1: Know your buying power ───────────────────────────────────
const S1_PX = 345, S1_PY = 500;
const s1Content = `
  <!-- App header -->
  <rect x="${S1_PX+6}" y="${S1_PY+6}" width="588" height="70" fill="${G_MID}"/>
  <text x="${S1_PX+30}" y="${S1_PY+46}" font-family="sans-serif" font-size="22" font-weight="800" fill="white">🍞 Bread Crumbs</text>
  <text x="${S1_PX+530}" y="${S1_PY+38}" font-family="sans-serif" font-size="14" fill="#A8D5BC" text-anchor="end">Step 4 of 9</text>

  <!-- Step bar dots -->
  <rect x="${S1_PX+6}" y="${S1_PY+76}" width="588" height="36" fill="white"/>
  ${[0,1,2,3,4,5,6,7,8].map((i) => {
    const cx = S1_PX + 30 + i * 66;
    const cy = S1_PY + 94;
    const filled = i <= 3;
    return `<circle cx="${cx}" cy="${cy}" r="11" fill="${filled ? G_MID : '#E5E7EB'}"/>
            ${i < 8 ? `<rect x="${cx+11}" y="${cy-1}" width="44" height="2" fill="${filled ? G_MID : '#E5E7EB'}"/>` : ''}`;
  }).join('')}

  <!-- Page title -->
  <rect x="${S1_PX+6}" y="${S1_PY+112}" width="588" height="50" fill="${OFF_W}"/>
  <text x="${S1_PX+20}" y="${S1_PY+145}" font-family="sans-serif" font-size="24" font-weight="900" fill="${TEXT}">🏠 Your target home</text>

  <!-- Main price display card -->
  <rect x="${S1_PX+20}" y="${S1_PY+175}" width="560" height="130" rx="14" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${S1_PX+40}" y="${S1_PY+210}" font-family="sans-serif" font-size="13" font-weight="700" fill="${G_MID}">TARGET HOME PRICE</text>
  <text x="${S1_PX+40}" y="${S1_PY+265}" font-family="sans-serif" font-size="52" font-weight="900" fill="${TEXT}">$340,000</text>
  <rect x="${S1_PX+40}" y="${S1_PY+285}" width="480" height="6" rx="3" fill="#E5E7EB"/>
  <rect x="${S1_PX+40}" y="${S1_PY+285}" width="240" height="6" rx="3" fill="${G_MID}"/>

  <!-- Affordability range card -->
  <rect x="${S1_PX+20}" y="${S1_PY+320}" width="560" height="100" rx="14" fill="${G_DARK}"/>
  <text x="${S1_PX+40}" y="${S1_PY+352}" font-family="sans-serif" font-size="13" font-weight="700" fill="#A8D5BC">YOUR AFFORDABILITY RANGE</text>
  <text x="${S1_PX+40}" y="${S1_PY+395}" font-family="sans-serif" font-size="28" font-weight="900" fill="white">$290K – $385K</text>
  <text x="${S1_PX+530}" y="${S1_PY+395}" font-family="sans-serif" font-size="13" fill="${G_PALE}" text-anchor="end">✓ In range</text>

  <!-- 3 stat cards -->
  <rect x="${S1_PX+20}" y="${S1_PY+435}" width="175" height="90" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${S1_PX+108}" y="${S1_PY+468}" font-family="sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">Down Payment</text>
  <text x="${S1_PX+108}" y="${S1_PY+500}" font-family="sans-serif" font-size="22" font-weight="800" fill="${TEXT}" text-anchor="middle">$17,000</text>

  <rect x="${S1_PX+207}" y="${S1_PY+435}" width="175" height="90" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${S1_PX+295}" y="${S1_PY+468}" font-family="sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">Monthly Est.</text>
  <text x="${S1_PX+295}" y="${S1_PY+500}" font-family="sans-serif" font-size="22" font-weight="800" fill="${G_MID}" text-anchor="middle">$2,140</text>

  <rect x="${S1_PX+394}" y="${S1_PY+435}" width="175" height="90" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${S1_PX+482}" y="${S1_PY+468}" font-family="sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">Loan Type</text>
  <text x="${S1_PX+482}" y="${S1_PY+500}" font-family="sans-serif" font-size="22" font-weight="800" fill="${AMBER}" text-anchor="middle">FHA</text>

  <!-- Loan type cards -->
  <rect x="${S1_PX+20}" y="${S1_PY+540}" width="560" height="110" rx="14" fill="white" stroke="${G_MID}" stroke-width="2"/>
  <rect x="${S1_PX+30}" y="${S1_PY+555}" width="120" height="22" rx="6" fill="${AMBER}"/>
  <text x="${S1_PX+90}" y="${S1_PY+571}" font-family="sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">⭐ RECOMMENDED</text>
  <text x="${S1_PX+40}" y="${S1_PY+600}" font-family="sans-serif" font-size="18" font-weight="800" fill="${TEXT}">🏛️ FHA Loan</text>
  <text x="${S1_PX+40}" y="${S1_PY+630}" font-family="sans-serif" font-size="32" font-weight="900" fill="${G_MID}">6.48%</text>
  <text x="${S1_PX+300}" y="${S1_PY+600}" font-family="sans-serif" font-size="12" fill="${G_PALE}">✓ 3.5% minimum down</text>
  <text x="${S1_PX+300}" y="${S1_PY+620}" font-family="sans-serif" font-size="12" fill="${G_PALE}">✓ 580+ credit score</text>
  <text x="${S1_PX+300}" y="${S1_PY+640}" font-family="sans-serif" font-size="12" fill="${G_PALE}">✓ Flexible qualification</text>

  <!-- CTA button -->
  <rect x="${S1_PX+20}" y="${S1_PY+668}" width="560" height="56" rx="14" fill="${G_MID}"/>
  <text x="${S1_PX+300}" y="${S1_PY+702}" font-family="sans-serif" font-size="18" font-weight="800" fill="white" text-anchor="middle">Continue →</text>
`;

const svg1 = phoneFrame(s1Content, "Know your buying power", "Real numbers. No guesswork.");

// ─── SCREENSHOT 2: Down payment assistance ───────────────────────────────────
const S2_PX = 345, S2_PY = 500;
const s2Content = `
  <rect x="${S2_PX+6}" y="${S2_PY+6}" width="588" height="70" fill="${G_MID}"/>
  <text x="${S2_PX+30}" y="${S2_PY+46}" font-family="sans-serif" font-size="22" font-weight="800" fill="white">🍞 Bread Crumbs</text>
  <text x="${S2_PX+530}" y="${S2_PY+38}" font-family="sans-serif" font-size="14" fill="#A8D5BC" text-anchor="end">Step 6 of 9</text>

  <rect x="${S2_PX+6}" y="${S2_PY+112}" width="588" height="50" fill="${OFF_W}"/>
  <text x="${S2_PX+20}" y="${S2_PY+145}" font-family="sans-serif" font-size="24" font-weight="900" fill="${TEXT}">🎯 Available programs</text>

  <!-- AMI banner -->
  <rect x="${S2_PX+20}" y="${S2_PY+175}" width="560" height="80" rx="12" fill="${G_DARK}"/>
  <text x="${S2_PX+40}" y="${S2_PY+202}" font-family="sans-serif" font-size="12" fill="#A8D5BC">AREA MEDIAN INCOME · Harris County, TX</text>
  <text x="${S2_PX+40}" y="${S2_PY+237}" font-family="sans-serif" font-size="13" fill="white">80% AMI: <tspan font-weight="700">$64,000</tspan>  ·  100% AMI: <tspan font-weight="700">$80,000</tspan>  ·  120% AMI: <tspan font-weight="700">$96,000</tspan></text>

  <!-- Program card 1 - ELIGIBLE -->
  <rect x="${S2_PX+20}" y="${S2_PY+270}" width="560" height="140" rx="14" fill="white" stroke="#D1FAE5" stroke-width="2"/>
  <rect x="${S2_PX+30}" y="${S2_PY+283}" width="80" height="22" rx="6" fill="#D1FAE5"/>
  <text x="${S2_PX+70}" y="${S2_PY+299}" font-family="sans-serif" font-size="11" font-weight="700" fill="#065F46" text-anchor="middle">✓ ELIGIBLE</text>
  <text x="${S2_PX+40}" y="${S2_PY+330}" font-family="sans-serif" font-size="16" font-weight="800" fill="${TEXT}">TDHCA My First Texas Home</text>
  <text x="${S2_PX+40}" y="${S2_PY+355}" font-family="sans-serif" font-size="13" fill="#6B7280">Up to 5% down payment assistance</text>
  <text x="${S2_PX+40}" y="${S2_PY+375}" font-family="sans-serif" font-size="13" fill="#6B7280">Income limit: ~115% AMI · $92,000</text>
  <text x="${S2_PX+500}" y="${S2_PY+355}" font-family="sans-serif" font-size="22" font-weight="900" fill="${G_MID}" text-anchor="end">$17,000</text>
  <text x="${S2_PX+500}" y="${S2_PY+378}" font-family="sans-serif" font-size="12" fill="#6B7280" text-anchor="end">potential grant</text>
  <text x="${S2_PX+40}" y="${S2_PY+400}" font-family="sans-serif" font-size="12" fill="${G_MID}">🔗 tdhca.state.tx.us</text>

  <!-- Program card 2 - ELIGIBLE -->
  <rect x="${S2_PX+20}" y="${S2_PY+425}" width="560" height="130" rx="14" fill="white" stroke="#D1FAE5" stroke-width="2"/>
  <rect x="${S2_PX+30}" y="${S2_PY+438}" width="80" height="22" rx="6" fill="#D1FAE5"/>
  <text x="${S2_PX+70}" y="${S2_PY+454}" font-family="sans-serif" font-size="11" font-weight="700" fill="#065F46" text-anchor="middle">✓ ELIGIBLE</text>
  <text x="${S2_PX+40}" y="${S2_PY+490}" font-family="sans-serif" font-size="16" font-weight="800" fill="${TEXT}">TSAHC Home Sweet Texas</text>
  <text x="${S2_PX+40}" y="${S2_PY+515}" font-family="sans-serif" font-size="13" fill="#6B7280">3–5% assistance · No repayment required</text>
  <text x="${S2_PX+500}" y="${S2_PY+510}" font-family="sans-serif" font-size="22" font-weight="900" fill="${G_MID}" text-anchor="end">$10,200</text>
  <text x="${S2_PX+500}" y="${S2_PY+533}" font-family="sans-serif" font-size="12" fill="#6B7280" text-anchor="end">potential grant</text>
  <text x="${S2_PX+40}" y="${S2_PY+545}" font-family="sans-serif" font-size="12" fill="${G_MID}">🔗 tsahc.org</text>

  <!-- Summary bar -->
  <rect x="${S2_PX+20}" y="${S2_PY+570}" width="560" height="80" rx="12" fill="${G_MID}"/>
  <text x="${S2_PX+40}" y="${S2_PY+600}" font-family="sans-serif" font-size="13" fill="#A8D5BC">You may qualify for</text>
  <text x="${S2_PX+40}" y="${S2_PY+635}" font-family="sans-serif" font-size="30" font-weight="900" fill="white">Up to $27,200 in assistance</text>

  <!-- CTA -->
  <rect x="${S2_PX+20}" y="${S2_PY+665}" width="560" height="56" rx="14" fill="${G_MID}"/>
  <text x="${S2_PX+300}" y="${S2_PY+699}" font-family="sans-serif" font-size="18" font-weight="800" fill="white" text-anchor="middle">See all programs →</text>
`;

const svg2 = phoneFrame(s2Content, "Unlock assistance you deserve", "Programs matched to your situation.");

// ─── SCREENSHOT 3: True monthly cost ────────────────────────────────────────
const S3_PX = 345, S3_PY = 500;
const s3Content = `
  <rect x="${S3_PX+6}" y="${S3_PY+6}" width="588" height="70" fill="${G_MID}"/>
  <text x="${S3_PX+30}" y="${S3_PY+46}" font-family="sans-serif" font-size="22" font-weight="800" fill="white">🍞 Bread Crumbs</text>

  <rect x="${S3_PX+6}" y="${S3_PY+112}" width="588" height="50" fill="${OFF_W}"/>
  <text x="${S3_PX+20}" y="${S3_PY+145}" font-family="sans-serif" font-size="24" font-weight="900" fill="${TEXT}">✨ Your full picture</text>

  <!-- Total monthly hero -->
  <rect x="${S3_PX+20}" y="${S3_PY+175}" width="560" height="120" rx="14" fill="${G_DARK}"/>
  <text x="${S3_PX+300}" y="${S3_PY+215}" font-family="sans-serif" font-size="13" fill="#A8D5BC" text-anchor="middle">TOTAL MONTHLY COST</text>
  <text x="${S3_PX+300}" y="${S3_PY+275}" font-family="sans-serif" font-size="60" font-weight="900" fill="white" text-anchor="middle">$3,284</text>

  <!-- Cost breakdown -->
  <text x="${S3_PX+30}" y="${S3_PY+330}" font-family="sans-serif" font-size="13" font-weight="700" fill="#6B7280">MONTHLY BREAKDOWN</text>

  ${[
    { label: "Principal &amp; Interest", val: "$1,820", pct: 55, color: G_MID },
    { label: "Property Tax (est.)", val: "$624", pct: 19, color: BLUE },
    { label: "Homeowner's Insurance", val: "$340", pct: 10, color: AMBER },
    { label: "Utilities (avg.)", val: "$280", pct: 9, color: "#8B5CF6" },
    { label: "HOA / PMI / MIP", val: "$220", pct: 7, color: "#EC4899" },
  ].map((item, i) => {
    const y = S3_PY + 355 + i * 62;
    return `
      <rect x="${S3_PX+20}" y="${y}" width="560" height="52" rx="10" fill="white" stroke="#F3F4F6" stroke-width="1"/>
      <rect x="${S3_PX+20}" y="${y}" width="${item.pct * 5.6}" height="4" rx="2" fill="${item.color}" opacity="0.3"/>
      <rect x="${S3_PX+20}" y="${y}" width="${item.pct * 5.6}" height="4" rx="2" fill="${item.color}"/>
      <text x="${S3_PX+36}" y="${y + 32}" font-family="sans-serif" font-size="14" fill="${TEXT}">${item.label}</text>
      <text x="${S3_PX+564}" y="${y + 32}" font-family="sans-serif" font-size="16" font-weight="700" fill="${TEXT}" text-anchor="end">${item.val}</text>
    `;
  }).join('')}

  <!-- CTA -->
  <rect x="${S3_PX+20}" y="${S3_PY+680}" width="560" height="56" rx="14" fill="${G_MID}"/>
  <text x="${S3_PX+300}" y="${S3_PY+714}" font-family="sans-serif" font-size="18" font-weight="800" fill="white" text-anchor="middle">See my action plan →</text>
`;

const svg3 = phoneFrame(s3Content, "No surprises. Ever.", "Every dollar of your monthly cost, revealed.");

// ─── SCREENSHOT 4: Action plan ───────────────────────────────────────────────
const S4_PX = 345, S4_PY = 500;
const s4Content = `
  <rect x="${S4_PX+6}" y="${S4_PY+6}" width="588" height="70" fill="${G_MID}"/>
  <text x="${S4_PX+30}" y="${S4_PY+46}" font-family="sans-serif" font-size="22" font-weight="800" fill="white">🍞 Bread Crumbs</text>

  <rect x="${S4_PX+6}" y="${S4_PY+112}" width="588" height="50" fill="${OFF_W}"/>
  <text x="${S4_PX+20}" y="${S4_PY+145}" font-family="sans-serif" font-size="24" font-weight="900" fill="${TEXT}">✅ Your action plan</text>

  <!-- Progress banner -->
  <rect x="${S4_PX+20}" y="${S4_PY+175}" width="560" height="72" rx="12" fill="${G_MID}"/>
  <text x="${S4_PX+40}" y="${S4_PY+207}" font-family="sans-serif" font-size="13" fill="#A8D5BC">Your 90-day roadmap to closing</text>
  <rect x="${S4_PX+40}" y="${S4_PY+218}" width="480" height="8" rx="4" fill="${G_DARK}" opacity="0.5"/>
  <rect x="${S4_PX+40}" y="${S4_PY+218}" width="160" height="8" rx="4" fill="white"/>
  <text x="${S4_PX+530}" y="${S4_PY+228}" font-family="sans-serif" font-size="13" fill="white" text-anchor="end">33%</text>

  <!-- Action items -->
  ${[
    { week: "This week", title: "Get your free credit report", body: "annualcreditreport.com · Free, no impact", done: true },
    { week: "This week", title: "Open a dedicated savings account", body: "Separate from checking — automate $500/mo", done: true },
    { week: "Week 2", title: "Get pre-qualified with 3 lenders", body: "Compare rates — 30 days won't hurt your score", done: false },
    { week: "Week 3", title: "Apply for TDHCA My First Texas Home", body: "Visit tdhca.state.tx.us · Income verified", done: false },
    { week: "Month 2", title: "Interview 2 buyer's agents", body: "Ask about experience with DPA programs", done: false },
  ].map((item, i) => {
    const y = S4_PY + 265 + i * 82;
    return `
      <rect x="${S4_PX+20}" y="${y}" width="560" height="72" rx="12" fill="${item.done ? '#F0FDF4' : 'white'}"
            stroke="${item.done ? '#BBF7D0' : '#F3F4F6'}" stroke-width="1.5"/>
      <circle cx="${S4_PX+50}" cy="${y+36}" r="16" fill="${item.done ? G_MID : '#F3F4F6'}"/>
      <text x="${S4_PX+50}" y="${y+41}" font-family="sans-serif" font-size="14" fill="${item.done ? 'white' : '#9CA3AF'}"
            text-anchor="middle">${item.done ? '✓' : (i+1)}</text>
      <text x="${S4_PX+78}" y="${y+24}" font-family="sans-serif" font-size="11" fill="${G_MID}" font-weight="600">${item.week}</text>
      <text x="${S4_PX+78}" y="${y+44}" font-family="sans-serif" font-size="14" font-weight="700" fill="${TEXT}">${item.title}</text>
      <text x="${S4_PX+78}" y="${y+62}" font-family="sans-serif" font-size="12" fill="#6B7280">${item.body}</text>
    `;
  }).join('')}
`;

const svg4 = phoneFrame(s4Content, "Your personalized roadmap", "Step-by-step from today to closing day.");

// ─── SCREENSHOT 5: Sign in / onboarding ─────────────────────────────────────
const S5_PX = 345, S5_PY = 500;
const s5Content = `
  <!-- Green header area -->
  <rect x="${S5_PX+6}" y="${S5_PY+6}" width="588" height="340" fill="${G_MID}" rx="40"/>
  <rect x="${S5_PX+6}" y="${S5_PY+260}" width="588" height="90" fill="${G_MID}"/>

  <!-- Logo placeholder -->
  <circle cx="${S5_PX+300}" cy="${S5_PY+130}" r="90" fill="${G_DARK}" opacity="0.4"/>
  <text x="${S5_PX+300}" y="${S5_PY+155}" font-family="Georgia,serif" font-size="80" font-weight="900"
        fill="white" text-anchor="middle">B</text>
  <text x="${S5_PX+300}" y="${S5_PY+220}" font-family="sans-serif" font-size="28" font-weight="900"
        fill="white" text-anchor="middle">Bread Crumbs</text>
  <text x="${S5_PX+300}" y="${S5_PY+256}" font-family="sans-serif" font-size="16" font-weight="500"
        fill="#A8D5BC" text-anchor="middle">Your financial roadmap to homeownership</text>

  <!-- Auth card -->
  <rect x="${S5_PX+30}" y="${S5_PY+320}" width="540" height="480" rx="20" fill="white"/>

  <!-- Tab toggle -->
  <rect x="${S5_PX+50}" y="${S5_PY+340}" width="500" height="44" rx="10" fill="#F3F4F6"/>
  <rect x="${S5_PX+52}" y="${S5_PY+342}" width="246" height="40" rx="8" fill="white"/>
  <text x="${S5_PX+175}" y="${S5_PY+368}" font-family="sans-serif" font-size="15" font-weight="800"
        fill="${TEXT}" text-anchor="middle">Log In</text>
  <text x="${S5_PX+423}" y="${S5_PY+368}" font-family="sans-serif" font-size="15" font-weight="600"
        fill="#9CA3AF" text-anchor="middle">Sign Up</text>

  <!-- Email field -->
  <text x="${S5_PX+50}" y="${S5_PY+412}" font-family="sans-serif" font-size="12" font-weight="700" fill="${TEXT}">Email</text>
  <rect x="${S5_PX+50}" y="${S5_PY+420}" width="500" height="48" rx="10" fill="white" stroke="#D1D5DB" stroke-width="1.5"/>
  <text x="${S5_PX+68}" y="${S5_PY+450}" font-family="sans-serif" font-size="15" fill="#9CA3AF">you@email.com</text>

  <!-- Password field -->
  <text x="${S5_PX+50}" y="${S5_PY+494}" font-family="sans-serif" font-size="12" font-weight="700" fill="${TEXT}">Password</text>
  <rect x="${S5_PX+50}" y="${S5_PY+502}" width="500" height="48" rx="10" fill="white" stroke="#D1D5DB" stroke-width="1.5"/>
  <text x="${S5_PX+68}" y="${S5_PY+532}" font-family="sans-serif" font-size="15" fill="#9CA3AF">••••••••</text>

  <!-- Login button -->
  <rect x="${S5_PX+50}" y="${S5_PY+568}" width="500" height="52" rx="12" fill="${G_MID}"/>
  <text x="${S5_PX+300}" y="${S5_PY+600}" font-family="sans-serif" font-size="17" font-weight="800"
        fill="white" text-anchor="middle">Log In →</text>

  <!-- Sub links -->
  <text x="${S5_PX+300}" y="${S5_PY+648}" font-family="sans-serif" font-size="13" fill="#6B7280" text-anchor="middle">
    Don't have an account? Sign up
  </text>
  <text x="${S5_PX+300}" y="${S5_PY+674}" font-family="sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle">
    Forgot password?
  </text>

  <!-- Trust line -->
  <text x="${S5_PX+300}" y="${S5_PY+720}" font-family="sans-serif" font-size="13" fill="${G_MID}" text-anchor="middle">
    🔒 Your progress saves automatically
  </text>
  <text x="${S5_PX+300}" y="${S5_PY+748}" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">
    Privacy Policy · Terms of Use
  </text>
`;

const svg5 = phoneFrame(
  s5Content,
  "Save your progress. Come back anytime.",
  "Built for real homebuyers. Completely free.",
  "#0D3D24",
  "#1B4D30"
);

// ─── GENERATE ALL FILES ──────────────────────────────────────────────────────
async function main() {
  console.log("Generating assets...");

  // 1. Logo 1024×1024
  await sharp(Buffer.from(logoSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, "icon.png"));
  console.log("✓ icon.png (1024×1024)");

  // 2. Screenshots
  const screenshots = [
    { svg: svg1, name: "screenshot-1-buying-power.png" },
    { svg: svg2, name: "screenshot-2-dpa-programs.png" },
    { svg: svg3, name: "screenshot-3-monthly-cost.png" },
    { svg: svg4, name: "screenshot-4-action-plan.png" },
    { svg: svg5, name: "screenshot-5-onboarding.png" },
  ];

  for (const { svg, name } of screenshots) {
    await sharp(Buffer.from(svg))
      .resize(1290, 2796)
      .png()
      .toFile(path.join(ASSETS, name));
    console.log(`✓ ${name} (1290×2796)`);
  }

  console.log("\nAll assets saved to: " + ASSETS);
}

main().catch(err => { console.error(err); process.exit(1); });
