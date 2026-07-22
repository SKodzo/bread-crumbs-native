import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { getPropTaxRate } from "../../lib/data";
import { Card, SecTitle, Alert, NavButtons } from "../../components/UI";

// Same transfer tax + closing calc — keep in sync with Costs/Proceeds screens
const TRANSFER_TAX_RATE = {
  NY: 4.0, CA: 1.1, PA: 10.0, DC: 14.0, MD: 5.0, NJ: 5.85, CT: 7.5,
  WA: 1.78, IL: 1.0, VA: 1.0, DE: 4.0, NH: 7.5, VT: 6.25, HI: 1.0,
  MA: 4.56, RI: 4.6, MN: 3.3, WI: 3.0, MI: 8.6, NV: 2.55,
};
const calcNetProceeds = (d) => {
  const st = d.locationInfo?.state || "TX";
  const hv = d.homeValue || 0;
  const comm = Math.round(hv * (d.commissionPct || 5.5) / 100);
  const propTax = Math.round(hv * getPropTaxRate(st) / 2);
  const closing = Math.round(hv * 0.005) + Math.round(hv * 0.01) + propTax + 250 + Math.round(hv / 1000 * (TRANSFER_TAX_RATE[st] || 0));
  const prep = (d.repairs || 0) + (d.staging || 0) + (d.photography || 0);
  return Math.max(0, hv - comm - closing - prep - (d.mortgageBalance || 0));
};

const TIMELINE_OPTS = [
  { v: "asap", label: "ASAP" },
  { v: "1-3mo", label: "1–3 months" },
  { v: "3-6mo", label: "3–6 months" },
  { v: "6-12mo", label: "6–12 months" },
];

// Estimated market conditions by state bucket (general guidance)
const MARKET_DATA = {
  hot:  { median: "Above asking", dom: "12 days", ratio: "102%", yoy: "+6.2%" },
  warm: { median: "Near asking", dom: "28 days", ratio: "99%", yoy: "+3.1%" },
  cool: { median: "Below asking", dom: "45 days", ratio: "96%", yoy: "+0.8%" },
};
const HOT_STATES = ["CA","WA","CO","UT","AZ","TX","FL","NC","TN","ID","MT","NV"];
const COOL_STATES = ["WV","MS","LA","AL","AR","KY","OH","IA","KS"];
const getMarketBucket = (st) => HOT_STATES.includes(st) ? "hot" : COOL_STATES.includes(st) ? "cool" : "warm";

const PRICING = [
  { v: "aggressive", pct: "~97%", label: "Price to sell fast", note: "Slightly below market — attracts multiple offers" },
  { v: "market", pct: "~100%", label: "At market value", note: "Fair price — typical time on market" },
  { v: "aspirational", pct: "~104%", label: "Aspirational", note: "Above market — may sit longer, tests ceiling" },
];

const AFTER_OPTS = [
  { v: "buy", icon: "🏠", label: "Buy another home" },
  { v: "rent", icon: "🏢", label: "Rent for now" },
  { v: "cash", icon: "💰", label: "Cash out" },
];

export default function SellerTimingScreen({ data, setData, onNext, onBack, onSwitchMode }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "TX";
  const timeline = d.listTimeline || "asap";
  const afterSale = d.afterSale;
  const bucket = getMarketBucket(st);
  const market = MARKET_DATA[bucket];
  const proceeds = calcNetProceeds(d);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* When to list */}
      <Card>
        <SecTitle>When do you plan to list?</SecTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {TIMELINE_OPTS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              onPress={() => setData({ ...d, listTimeline: opt.v })}
              style={{ flex: 1, minWidth: "45%", borderWidth: 2, borderRadius: 10, padding: 10, alignItems: "center", borderColor: timeline === opt.v ? C.amber : C.gray300, backgroundColor: timeline === opt.v ? C.amberLight : C.card }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: timeline === opt.v ? C.amber : C.charcoal }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Market snapshot */}
      <Card>
        <SecTitle>Local market snapshot ({st})</SecTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {[
            { label: "Median price", value: market.median, icon: "💰" },
            { label: "Days on market", value: market.dom, icon: "📅" },
            { label: "List-to-sale ratio", value: market.ratio, icon: "📊" },
            { label: "YoY change", value: market.yoy, icon: "📈" },
          ].map((stat, i) => (
            <View key={i} style={{ width: "48%", padding: 12, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.gray200 }}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>{stat.icon}</Text>
              <Text style={{ fontSize: 16, fontWeight: "900", color: C.text }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: C.gray500, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 10, color: C.gray400, marginTop: 6, textAlign: "center" }}>General estimates by region — consult a local agent for current market data.</Text>
        <View style={{ marginTop: 10, gap: 6 }}>
          {[
            { term: "Days on Market (DOM)", def: "How long the average listing sits before going under contract. Source: National Association of Realtors regional medians." },
            { term: "List-to-Sale Ratio", def: "Final sale price ÷ original list price. 102% means buyers paid above asking; 96% means discounts were common." },
            { term: "YoY Change", def: "Year-over-Year median price shift — how much values rose or fell compared to the same period last year." },
          ].map((item, i) => (
            <View key={i} style={{ backgroundColor: C.amberLight, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.amber }}>{item.term}</Text>
              <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2, lineHeight: 15 }}>{item.def}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Pricing strategy */}
      <Card>
        <SecTitle>Pricing strategy</SecTitle>
        <View style={{ gap: 6 }}>
          {PRICING.map(p => (
            <TouchableOpacity
              key={p.v}
              onPress={() => setData({ ...d, pricingStrategy: p.v })}
              style={{ borderWidth: 2, borderRadius: 10, padding: 12, borderColor: d.pricingStrategy === p.v ? C.amber : C.gray300, backgroundColor: d.pricingStrategy === p.v ? C.amberLight : C.card }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: d.pricingStrategy === p.v ? C.amber : C.charcoal }}>{p.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: "800", color: C.amber }}>{p.pct}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>{p.note}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* After the sale */}
      <Card>
        <SecTitle>After the sale, I plan to...</SecTitle>
        <View style={{ gap: 6 }}>
          {AFTER_OPTS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              onPress={() => setData({ ...d, afterSale: opt.v })}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderRadius: 10, padding: 12, borderColor: afterSale === opt.v ? C.amber : C.gray300, backgroundColor: afterSale === opt.v ? C.amberLight : C.card }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: afterSale === opt.v ? C.amber : C.charcoal, flex: 1 }}>{opt.label}</Text>
              {afterSale === opt.v && opt.v !== "cash" && (
                <Text style={{ fontSize: 14, color: C.amber }}>→</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {afterSale === "buy" && (
          <TouchableOpacity
            onPress={() => onSwitchMode("buying")}
            style={{ marginTop: 10, padding: 14, backgroundColor: C.green, borderRadius: 10, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Start buying plan with {fmt(proceeds)}</Text>
          </TouchableOpacity>
        )}
        {afterSale === "rent" && (
          <TouchableOpacity
            onPress={() => onSwitchMode("renting")}
            style={{ marginTop: 10, padding: 14, backgroundColor: C.blue || C.amber, borderRadius: 10, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Start renting plan →</Text>
          </TouchableOpacity>
        )}
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Action plan →" color={C.amber} />

    </ScrollView>
  );
}
