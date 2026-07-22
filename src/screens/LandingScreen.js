import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Animated } from "react-native";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemeMode } from "../lib/theme";
import { useRates } from "../lib/useRates";
import { useFedRate } from "../lib/useFedRate";
import { fmt } from "../lib/math";
import FlowMenu from "../components/FlowMenu";

const HYSA_BANKS = [
  { name: "SoFi",           apy: 4.60 },
  { name: "Marcus",         apy: 4.40 },
  { name: "Ally",           apy: 4.35 },
  { name: "Chase",          apy: 0.01 },
  { name: "Bank of America", apy: 0.01 },
  { name: "Wells Fargo",    apy: 0.01 },
  { name: "Citi",           apy: 0.04 },
  { name: "TD Bank",        apy: 0.02 },
  { name: "Other",          apy: null  },
];

const GLOSSARY = {
  buying: [
    { q: "What is a mortgage rate?", a: "The interest rate on your home loan. Lower = smaller monthly payment. A 1% difference on a $300K loan is about $180/mo." },
    { q: "What is APY?", a: "Annual Percentage Yield — the real rate your savings earn per year. Your down payment savings should be in a high-yield account, not a regular bank earning 0.01%." },
    { q: "What is refinancing?", a: "Swapping your current loan for a new one at a lower rate. You pay closing costs upfront (~$3–5K) and save monthly. Only worth it if you'll stay long enough to break even." },
    { q: "Federal vs. private student loans?", a: "Federal loans come with income-driven repayment and forgiveness programs. Refinancing to private removes those protections permanently." },
  ],
  selling: [
    { q: "What is a seller's market?", a: "More buyers than homes for sale. You get faster offers, less negotiating, and often above asking price. Days on market under 30 is a strong signal." },
    { q: "What are net proceeds?", a: "What you actually walk away with after paying off your mortgage, agent commission (~5–6%), and closing costs. Your Bread Crumbs seller plan calculates this for you." },
    { q: "What moves mortgage rates?", a: "The 10-year Treasury and inflation. Rates affect your buyers' purchasing power — lower rates bring more buyers and stronger offers for your home." },
    { q: "What is capital gains tax?", a: "Tax on your profit from selling. If you lived in the home 2+ of the last 5 years, you can exclude up to $250K ($500K married) from federal tax." },
  ],
};

function getMarketType(rate30, homeSales, hpiYoY) {
  let score = 0;
  if (rate30 > 7.5) score += 2; else if (rate30 > 6.5) score += 1; else if (rate30 < 5.5) score -= 2; else if (rate30 < 6.5) score -= 1;
  if (homeSales.current < homeSales.prev * 0.97) score += 1; else if (homeSales.current > homeSales.prev * 1.03) score -= 1;
  if (hpiYoY < 2) score += 1; else if (hpiYoY > 6) score -= 1;
  if (score >= 2) return "buyer";
  if (score <= -2) return "seller";
  return "balanced";
}

const MARKET_INFO = {
  buyer: {
    label: "Buyer's Market", emoji: "🎯", color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD",
    headline: "You have leverage — use it.",
    desc: "More homes for sale than buyers. Sellers are motivated to deal and competition is low.",
    tips: [
      { title: "Negotiate price down 3–5%", detail: "Sellers are waiting longer for offers. A below-list offer is reasonable and often accepted." },
      { title: "Ask for seller concessions", detail: "Request the seller cover closing costs (2–3% of price). In a buyer's market this is fair game." },
      { title: "Keep all your contingencies", detail: "Don't waive inspection or financing. You rarely need to in this market, and they protect you." },
      { title: "Request repairs after inspection", detail: "Sellers are less likely to walk away. Ask for credits or completed repairs." },
      { title: "Ask for a rate buydown", detail: "Request the seller pay points to lower your rate. Even 0.5% less saves you thousands over the loan." },
    ],
  },
  balanced: {
    label: "Balanced Market", emoji: "⚖️", color: "#1B6B44", bg: "#E8F5EE", border: "#6EE7B7",
    headline: "Standard negotiation applies — reasonable leverage on both sides.",
    desc: "Roughly equal supply and demand. Neither buyer nor seller has a strong advantage.",
    tips: [
      { title: "Offer 1–2% below list", detail: "Expect back-and-forth. Sellers will negotiate but won't accept lowball offers." },
      { title: "Keep standard contingencies", detail: "Inspection and financing are generally accepted. No pressure to waive them." },
      { title: "Ask for modest concessions", detail: "Requesting 1–2% in seller concessions is reasonable and often granted." },
      { title: "Take the full inspection period", detail: "Standard 10-day inspection windows are the norm. Use the full time." },
    ],
  },
  seller: {
    label: "Seller's Market", emoji: "🔥", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5",
    headline: "Competition is high — move fast and come prepared.",
    desc: "More buyers than homes available. Sellers get multiple offers and hold the leverage.",
    tips: [
      { title: "Get pre-approved before you search", detail: "Sellers won't consider an offer without pre-approval. Have it ready before you tour." },
      { title: "Move same-day on new listings", detail: "Homes sell in hours. Set up instant alerts and be ready to tour immediately." },
      { title: "Offer at or above asking", detail: "Offering below list will likely lose the home. Check comps and price to win." },
      { title: "Write an escalation clause", detail: "Set your max price and escalate above competing offers by a fixed amount." },
      { title: "Be flexible on closing date", detail: "A flexible close can win the deal at the same price. Sellers may need time to find their next home." },
    ],
  },
};

const MARKET_INFO_DARK = {
  buyer:    { bg: "#1A2744", border: "#2563EB", color: "#93C5FD" },
  balanced: { bg: "#0F2318", border: "#166534", color: "#4ADE80" },
  seller:   { bg: "#2D1010", border: "#B91C1C", color: "#FCA5A5" },
};

function MarketIndicatorCard({ rate30, homeSales, hpiYoY, rateDate, fedDate, C }) {
  const [showLeverage, setShowLeverage] = useState(false);
  const { resolved } = useThemeMode();
  const dark = resolved === "dark";
  const type = getMarketType(rate30, homeSales, hpiYoY);
  const info = MARKET_INFO[type];
  const darkInfo = MARKET_INFO_DARK[type];
  const bannerBg = dark ? darkInfo.bg : info.bg;
  const bannerBorder = dark ? darkInfo.border : info.border;
  const labelColor = dark ? darkInfo.color : info.color;
  const signalBg = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.05)";
  const salesPct = homeSales.prev > 0 ? ((homeSales.current - homeSales.prev) / homeSales.prev * 100).toFixed(1) : null;
  const salesUp = homeSales.current >= homeSales.prev;

  const buyerBlue  = dark ? "#93C5FD" : "#1D4ED8";
  const sellerRed  = dark ? "#FCA5A5" : "#DC2626";
  const neutralGrn = dark ? "#4ADE80" : C.green;

  const signals = [
    {
      label: "30-yr mortgage rate",
      value: rate30.toFixed(2) + "%",
      note: rate30 > 6.5 ? "↑ higher rates reduce buyer competition" : rate30 < 5.5 ? "↓ low rates bring more buyers" : "moderate",
      color: rate30 > 6.5 ? buyerBlue : rate30 < 5.5 ? sellerRed : neutralGrn,
    },
    {
      label: "Existing home sales",
      value: salesPct ? (salesUp ? "+" : "") + salesPct + "% MoM" : "—",
      note: salesUp ? "↑ rising demand" : "↓ less buyer competition",
      color: salesUp ? sellerRed : buyerBlue,
    },
    {
      label: "FHFA Home Price Index",
      value: (hpiYoY >= 0 ? "+" : "") + hpiYoY + "% YoY",
      note: hpiYoY < 2 ? "prices cooling" : hpiYoY > 6 ? "prices rising fast" : "moderate growth",
      color: hpiYoY > 6 ? sellerRed : hpiYoY < 2 ? buyerBlue : neutralGrn,
    },
  ];

  return (
    <View style={{ backgroundColor: bannerBg, borderRadius: 14, borderWidth: 1, borderColor: bannerBorder, padding: 14, marginBottom: 10 }}>
      {/* Banner */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <Text style={{ fontSize: 26 }}>{info.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: labelColor, letterSpacing: -0.3 }}>{info.label}</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: labelColor, marginTop: 2, lineHeight: 15 }}>{info.headline}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: C.text, lineHeight: 17, marginBottom: 10 }}>{info.desc}</Text>

      {/* Signal breakdown */}
      <View style={{ backgroundColor: signalBg, borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <Text style={{ fontSize: 9, fontWeight: "800", color: C.text, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Signal breakdown</Text>
        {signals.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 5, borderBottomWidth: i < signals.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 11, color: C.text, flex: 1 }}>{s.label}</Text>
            <View style={{ alignItems: "flex-end", maxWidth: 150 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: s.color, textAlign: "right" }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: s.color, opacity: 0.8, textAlign: "right" }}>{s.note}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Last updated */}
      {(rateDate || fedDate) && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
          <Text style={{ fontSize: 10, color: C.gray500 }}>
            Updated {rateDate || fedDate}
          </Text>
        </View>
      )}

      {/* Leverage toggle */}
      <TouchableOpacity onPress={() => setShowLeverage(o => !o)} activeOpacity={0.8}
        style={{ backgroundColor: info.color, borderRadius: 10, paddingVertical: 11, alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
          {showLeverage ? "Hide your leverage ↑" : "Show your leverage →"}
        </Text>
      </TouchableOpacity>

      {/* Leverage tips */}
      {showLeverage && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {info.tips.map((tip, i) => (
            <View key={i} style={{ backgroundColor: C.card, borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: info.color }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 2 }}>{tip.title}</Text>
              <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>{tip.detail}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function GlossaryItem({ q, a, C }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.7}
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 13, paddingVertical: 11 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: C.green, flex: 1, paddingRight: 8 }}>{q}</Text>
        <Text style={{ fontSize: 18, fontWeight: "400", color: C.green, lineHeight: 20 }}>{open ? "−" : "+"}</Text>
      </TouchableOpacity>
      {open && (
        <Text style={{ fontSize: 12, color: C.textSub, lineHeight: 18, paddingHorizontal: 13, paddingBottom: 11 }}>{a}</Text>
      )}
    </View>
  );
}

function RateCard({ label, value, sub, date, color, live, C }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 12 }}>
      <Text style={{ fontSize: 10, color: C.gray500, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: "700", color: color || C.green }}>{value}</Text>
      <Text style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>{sub}</Text>
      {date ? (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
          {live && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.green }} />}
          <Text style={{ fontSize: 9, color: live ? C.green : C.gray400 }}>{date}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function LandingScreen({ onSelect, session, sharedProfile, onUpdateSharedProfile }) {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  const { rates, loading: ratesLoading } = useRates();
  const { bestHysa, dff, medianPrice, hpiYoY, homeSales, updated: fedUpdated, loading: fedLoading } = useFedRate();

  const [tab, setTab] = useState("buying");
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [otherApy, setOtherApy] = useState("");
  const [loanType, setLoanType] = useState("private");
  const [currentRateInput, setCurrentRateInput] = useState(
    sharedProfile?.currentLoanRate ? String(sharedProfile.currentLoanRate) : ""
  );
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const todayRate = rates?.conv30 || 6.89;
  const rateDate = rates?.updated
    ? new Date(rates.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const fedDate = fedUpdated
    ? new Date(fedUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const userRate = parseFloat(currentRateInput) || null;
  const rateDiff = userRate ? userRate - todayRate : null;
  const worthRefi = rateDiff !== null && rateDiff >= 0.5;

  const loanBalance = sharedProfile?.loanBalance || 250000;
  const monthlyBefore = userRate
    ? (loanBalance * (userRate / 100 / 12)) / (1 - Math.pow(1 + userRate / 100 / 12, -360))
    : null;
  const monthlyAfter = (loanBalance * (todayRate / 100 / 12)) / (1 - Math.pow(1 + todayRate / 100 / 12, -360));
  const monthlySavings = monthlyBefore ? Math.round(monthlyBefore - monthlyAfter) : null;
  const breakEvenMonths = monthlySavings && monthlySavings > 0 ? Math.round(4000 / monthlySavings) : null;

  const bankApy = selectedBank?.name === "Other"
    ? (parseFloat(otherApy) || null)
    : (selectedBank?.apy ?? null);
  const savings = sharedProfile?.savings || 0;
  const apyGapPct = bankApy !== null ? bestHysa - bankApy : null;
  const apyGapDollars = apyGapPct !== null && savings > 0 ? Math.round(savings * apyGapPct / 100) : null;

  const saveRate = (val) => {
    setCurrentRateInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0 && onUpdateSharedProfile) {
      onUpdateSharedProfile({ currentLoanRate: parsed });
    }
  };

  const tabColor = tab === "buying" ? C.green : C.amber;

  const scrollY = useRef(new Animated.Value(0)).current;

  const HERO_MAX = 260 + insets.top;
  const HERO_MIN = 100 + insets.top;
  const COLLAPSE = 120;

  const heroHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE],
    outputRange: [HERO_MAX, HERO_MIN],
    extrapolate: "clamp",
  });
  const logoSize = scrollY.interpolate({
    inputRange: [0, COLLAPSE],
    outputRange: [200, 72],
    extrapolate: "clamp",
  });
  const textOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Hero — collapses on scroll */}
      <Animated.View style={{ backgroundColor: C.green, height: heroHeight, alignItems: "center", justifyContent: "center", paddingTop: insets.top, overflow: "hidden" }}>
        <View style={{ position: "absolute", top: insets.top + 10, right: 16, zIndex: 10 }}>
          <FlowMenu session={session} dotStyle />
        </View>
        <View style={{ alignItems: "center" }}>
          <Animated.Image
            source={require("../../assets/logo.png")}
            style={{ width: logoSize, height: logoSize, resizeMode: "contain", marginBottom: -45, marginTop: -15 }}
          />
          <Animated.Text style={{ fontSize: 22, fontWeight: "900", color: C.white, letterSpacing: -0.3, opacity: textOpacity }}>Bread Crumbs</Animated.Text>
          <Animated.Text style={{ fontSize: 13, color: "#a8d5bc", marginTop: 4, opacity: textOpacity }}>Your financial roadmap</Animated.Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1, marginTop: -14, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Path cards */}
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          Where are you headed?
        </Text>

        {[
          { key: "buying",  icon: "🏡", title: "Buying a home", sub: "Programs, loans, and your full action plan", color: C.green, bg: C.greenPale,  border: C.green },
          { key: "renting", icon: "🏢", title: "Renting",        sub: "Affordability, roommate split, and savings",  color: C.blue,  bg: C.blueLight, border: C.blue  },
          { key: "selling", icon: "🏷️", title: "Selling",        sub: "Net proceeds, tax impact, and timeline",      color: C.amber, bg: C.amberLight, border: C.amber },
        ].map(f => (
          <TouchableOpacity key={f.key} onPress={() => onSelect(f.key)} activeOpacity={0.85}
            style={{ backgroundColor: f.bg, borderRadius: 12, borderWidth: 0.5, borderColor: f.border, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: f.color }}>{f.title}</Text>
              <Text style={{ fontSize: 11, color: f.color, opacity: 0.75 }}>{f.sub}</Text>
            </View>
            <Text style={{ fontSize: 16, color: f.color, opacity: 0.5 }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* ── MARKET PULSE ── */}
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 20, marginBottom: 8 }}>
          Market pulse
        </Text>

        {/* Tab toggle — Buying / Selling only */}
        <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 10, padding: 3, marginBottom: 10, gap: 3 }}>
          {[["buying", "Buying"], ["selling", "Selling"]].map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setTab(key)} activeOpacity={0.8}
              style={{ flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 7,
                backgroundColor: tab === key ? (key === "buying" ? C.green : C.amber) : "transparent" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: tab === key ? C.white : C.gray500 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rate cards */}
        {ratesLoading ? (
          <ActivityIndicator color={tabColor} style={{ marginVertical: 16 }} />
        ) : tab === "buying" ? (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <RateCard label="30-yr fixed" value={rates.conv30?.toFixed(2) + "%"} sub="Avg mortgage rate" date={rateDate ? "Updated " + rateDate : null} live color={C.green} C={C} />
              <RateCard label="15-yr fixed" value={rates.conv15?.toFixed(2) + "%"} sub="Avg mortgage rate" date={rateDate ? "Updated " + rateDate : null} live color={C.green} C={C} />
            </View>
            {!fedLoading && (
              <MarketIndicatorCard rate30={todayRate} homeSales={homeSales} hpiYoY={hpiYoY} rateDate={rateDate} fedDate={fedDate} C={C} />
            )}
          </>
        ) : (
          <>
            {/* Row 1: Median price + Home sales */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <RateCard
                label="Median sale price"
                value={fedLoading ? "—" : "$" + (medianPrice / 1000).toFixed(0) + "K"}
                sub="US median"
                date={fedDate ? "Updated " + fedDate : null}
                live color={C.amber} C={C}
              />
              {(() => {
                const cur = homeSales.current;
                const prev = homeSales.prev;
                const diff = cur - prev;
                const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : null;
                const up = diff >= 0;
                const salesDate = homeSales.date
                  ? new Date(homeSales.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : null;
                return (
                  <RateCard
                    label="Existing home sales"
                    value={fedLoading ? "—" : (cur / 1000000).toFixed(2) + "M"}
                    sub={pct ? (up ? "▲ " : "▼ ") + Math.abs(pct) + "% vs prior month" : "Annual rate"}
                    date={salesDate ? "Updated " + salesDate : null}
                    live
                    color={up ? C.green : C.red}
                    C={C}
                  />
                );
              })()}
            </View>
            {/* Row 2: Price appreciation + buyer mortgage rates */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <RateCard
                label="Price appreciation"
                value={fedLoading ? "—" : (hpiYoY >= 0 ? "+" : "") + hpiYoY + "%"}
                sub="FHFA HPI, year-over-year"
                date={fedDate ? "Updated " + fedDate : null}
                live color={hpiYoY >= 0 ? C.green : C.red} C={C}
              />
              <RateCard
                label="30-yr buyer rate"
                value={ratesLoading ? "—" : rates.conv30?.toFixed(2) + "%"}
                sub="Affects your buyer pool"
                date={rateDate ? "Updated " + rateDate : null}
                live color={C.amber} C={C}
              />
            </View>
          </>
        )}

        {/* ── SAVINGS SECTION ── */}
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, marginBottom: 8 }}>
          Your savings
        </Text>

        {/* Live HYSA rate card */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <RateCard
            label="Fed funds rate"
            value={fedLoading ? "—" : dff.toFixed(2) + "%"}
            sub="Set by the Federal Reserve"
            date={fedDate ? "Updated " + fedDate : null}
            live
            color={C.green}
            C={C}
          />
          <RateCard
            label="Best HYSA rate"
            value={fedLoading ? "—" : bestHysa.toFixed(2) + "%"}
            sub="Top accounts track Fed rate"
            date={fedDate ? "Updated " + fedDate : null}
            live
            color={C.green}
            C={C}
          />
        </View>

        {/* Bank picker */}
        <TouchableOpacity onPress={() => setShowBankPicker(o => !o)} activeOpacity={0.8}
          style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: C.gray500 }}>Your savings bank</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
              {selectedBank ? `${selectedBank.name} — ${selectedBank.apy !== null ? selectedBank.apy + "% APY" : "unknown APY"}` : "Tap to select your bank"}
            </Text>
          </View>
          {apyGapDollars !== null && apyGapDollars > 0 && (
            <View style={{ backgroundColor: C.greenPale, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: C.green }}>+{fmt(apyGapDollars)}/yr missed</Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: C.gray400 }}>{showBankPicker ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showBankPicker && (
          <View style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, marginBottom: 8, overflow: "hidden" }}>
            {HYSA_BANKS.map((bank, i) => (
              <TouchableOpacity key={bank.name} onPress={() => { setSelectedBank(bank); setShowBankPicker(false); }} activeOpacity={0.7}
                style={{ paddingHorizontal: 14, paddingVertical: 11,
                  borderBottomWidth: i < HYSA_BANKS.length - 1 ? 0.5 : 0, borderBottomColor: C.border,
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  backgroundColor: selectedBank?.name === bank.name ? C.greenPale : "transparent" }}>
                <Text style={{ fontSize: 13, color: C.text }}>{bank.name}</Text>
                <Text style={{ fontSize: 12, color: bank.apy !== null && bank.apy >= 4 ? C.green : C.gray500 }}>
                  {bank.apy !== null ? bank.apy + "% APY" : "—"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other APY input */}
        {selectedBank?.name === "Other" && (
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 0.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, backgroundColor: C.bg }}>
            <Text style={{ fontSize: 12, color: C.gray500, marginRight: 8 }}>Your bank's APY</Text>
            <TextInput
              value={otherApy}
              onChangeText={setOtherApy}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.50"
              placeholderTextColor={C.gray400}
              style={{ flex: 1, fontSize: 14, fontWeight: "700", color: C.text, textAlign: "right" }}
            />
            <Text style={{ fontSize: 12, color: C.gray500, marginLeft: 4 }}>%</Text>
          </View>
        )}

        {/* Gap explanation */}
        {selectedBank && bankApy !== null && (
          <View style={{ backgroundColor: apyGapPct > 1 ? C.greenPale : C.gray100, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: apyGapPct > 1 ? C.green : C.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 11, color: C.gray500 }}>{selectedBank.name} APY</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{bankApy}%</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 11, color: C.gray500 }}>Best HYSA (live)</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.green }}>{bestHysa.toFixed(2)}%</Text>
            </View>
            {apyGapDollars !== null && savings > 0 ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.border }}>
                <Text style={{ fontSize: 11, color: C.gray500 }}>You could earn more per year</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.green }}>+{fmt(apyGapDollars)}</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
                {apyGapPct <= 0
                  ? "You're already with a top-rate account."
                  : "Add your savings balance in your profile to see your yearly gain."}
              </Text>
            )}
          </View>
        )}

        {/* ── REFINANCE CHECK ── */}
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8, marginBottom: 8 }}>
          Should you refinance?
        </Text>

        <View style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 13, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: C.text, marginBottom: 8 }}>What kind of loan do you have?</Text>
          <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 10, padding: 3, gap: 3, marginBottom: 12 }}>
            {[["private", "Private"], ["federal", "Federal"]].map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setLoanType(key)} activeOpacity={0.8}
                style={{ flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 7, backgroundColor: loanType === key ? C.green : "transparent" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: loanType === key ? C.white : C.gray500 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 0.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12, backgroundColor: C.bg }}>
            <Text style={{ fontSize: 12, color: C.gray500, marginRight: 8 }}>Your current rate</Text>
            <TextInput
              value={currentRateInput}
              onChangeText={saveRate}
              keyboardType="decimal-pad"
              placeholder="e.g. 7.40"
              placeholderTextColor={C.gray400}
              style={{ flex: 1, fontSize: 14, fontWeight: "700", color: C.text, textAlign: "right" }}
            />
            <Text style={{ fontSize: 12, color: C.gray500, marginLeft: 4 }}>%</Text>
          </View>

          {userRate && loanType === "federal" ? (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Your rate</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{userRate.toFixed(2)}%</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Today's rate (live)</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.green }}>{todayRate.toFixed(2)}%</Text>
              </View>
              <View style={{ backgroundColor: C.amberLight, borderRadius: 8, padding: 10, marginTop: 10 }}>
                <Text style={{ fontSize: 11, color: C.amber, lineHeight: 17, fontWeight: "600" }}>
                  Federal loans include income-driven repayment and forgiveness programs (like PSLF). Refinancing to private removes those protections permanently — talk to your servicer first.
                </Text>
              </View>
            </View>
          ) : userRate && loanType === "private" ? (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Your rate</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{userRate.toFixed(2)}%</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: monthlySavings !== null ? 0.5 : 0, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Today's rate (live)</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.green }}>{todayRate.toFixed(2)}%</Text>
              </View>
              {monthlySavings !== null && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: breakEvenMonths ? 0.5 : 0, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 11, color: C.gray500 }}>Monthly savings</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: monthlySavings > 0 ? C.green : C.red }}>
                    {monthlySavings > 0 ? "+" : ""}{fmt(monthlySavings)}/mo
                  </Text>
                </View>
              )}
              {breakEvenMonths && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: C.gray500 }}>Break-even</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>~{breakEvenMonths} months</Text>
                </View>
              )}
              <View style={{ backgroundColor: worthRefi ? C.greenPale : C.amberLight, borderRadius: 8, padding: 10, marginTop: 10 }}>
                <Text style={{ fontSize: 11, color: worthRefi ? C.green : C.amber, lineHeight: 17, fontWeight: "600" }}>
                  {worthRefi
                    ? `Refinancing could save you ${fmt(monthlySavings || 0)}/mo. No federal protections at risk — worth exploring with your lender.`
                    : "Your rate is close to today's market rate. The savings may not cover closing costs (~$3–5K). Worth watching if rates drop further."}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: C.gray400, textAlign: "center", paddingVertical: 8 }}>
              Enter your current rate above to see the comparison.
            </Text>
          )}
        </View>

        {/* ── GLOSSARY ── */}
        <TouchableOpacity onPress={() => setGlossaryOpen(o => !o)} activeOpacity={0.8}
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
            paddingHorizontal: 13, paddingVertical: 12, marginBottom: glossaryOpen ? 0 : 8,
            borderBottomLeftRadius: glossaryOpen ? 0 : 12, borderBottomRightRadius: glossaryOpen ? 0 : 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.text }}>Plain-English glossary</Text>
          <Text style={{ fontSize: 16, color: C.green }}>{glossaryOpen ? "−" : "+"}</Text>
        </TouchableOpacity>

        {glossaryOpen && (
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderTopWidth: 0, borderColor: C.border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 8, overflow: "hidden" }}>
            {(GLOSSARY[tab] || GLOSSARY.buying).map((item, i, arr) => (
              <View key={i} style={{ borderBottomWidth: i < arr.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                <GlossaryItem q={item.q} a={item.a} C={C} />
              </View>
            ))}
          </View>
        )}

        <Text style={{ fontSize: 9, color: C.gray400, textAlign: "center", marginTop: 4 }}>
          Mortgage rates via FRED · Savings rate derived from Fed Funds Rate · Updated daily
        </Text>
      </Animated.ScrollView>
    </View>
  );
}
