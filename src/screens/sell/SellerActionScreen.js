import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt } from "../../lib/math";
import { getPropTaxRate } from "../../lib/data";
import { Card, SecTitle, Alert, NavButtons } from "../../components/UI";
import { useState } from "react";

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

const TABS = [
  { v: "now", label: "Now" },
  { v: "1-2mo", label: "1–2 months" },
  { v: "listing", label: "Listing" },
  { v: "closing", label: "Closing" },
];

const CHECKLISTS = {
  now: [
    "Interview 2–3 listing agents",
    "Schedule a pre-listing home inspection",
    "Get a mortgage payoff statement",
    "Gather records of improvements and upgrades",
    "Check homestead exemption status",
    "Decide: sell first or buy first?",
  ],
  "1-2mo": [
    "Declutter and depersonalize each room",
    "Make priority repairs from inspection",
    "Schedule professional staging",
    "Get professional photos and video tour",
    "Set listing price with your agent",
  ],
  listing: [
    "List on MLS and syndicated sites",
    "Schedule open houses and showings",
    "Review incoming offers",
    "Negotiate price, contingencies, and timeline",
    "Accept the best offer",
  ],
  closing: [
    "Buyer inspection period — address requests",
    "Appraisal ordered by buyer's lender",
    "Title search and title insurance",
    "Review closing disclosure (3 days before)",
    "Final walkthrough with buyer",
    "Sign closing documents at title company",
    "Hand over keys — congratulations!",
  ],
};

export default function SellerActionScreen({ data, onBack, onDone, onSwitchMode }) {
  const C = useTheme();
  const d = data;
  const [activeTab, setActiveTab] = useState("now");
  const [checked, setChecked] = useState({});
  const proceeds = calcNetProceeds(d);

  const allItems = Object.values(CHECKLISTS).flat();
  const totalCount = allItems.length;
  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((doneCount / totalCount) * 100);

  const toggleCheck = (tab, idx) => {
    const key = `${tab}_${idx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CheckItem = ({ label, tab, idx }) => {
    const key = `${tab}_${idx}`;
    const done = !!checked[key];
    return (
      <TouchableOpacity onPress={() => toggleCheck(tab, idx)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.gray200 }}>
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: done ? C.amber : C.gray300, backgroundColor: done ? C.amber : C.card, marginTop: 1, alignItems: "center", justifyContent: "center" }}>
          {done && <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>}
        </View>
        <Text style={{ fontSize: 13, color: done ? C.gray500 : C.charcoal, flex: 1, lineHeight: 18, textDecorationLine: done ? "line-through" : "none" }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Timeline tabs */}
      <Card>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.v}
              onPress={() => setActiveTab(tab.v)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: activeTab === tab.v ? C.amber : C.card, borderWidth: activeTab === tab.v ? 0 : 1, borderColor: C.gray300 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: activeTab === tab.v ? "#fff" : C.charcoal }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Progress meter */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Overall progress</Text>
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.amber }}>{pct}%</Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: C.gray200, overflow: "hidden" }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.amber, width: `${pct}%` }} />
        </View>
        <Text style={{ fontSize: 10, color: C.gray500, marginTop: 4 }}>{doneCount} of {totalCount} tasks completed</Text>
      </Card>

      {/* Checklist */}
      <Card>
        <SecTitle>{TABS.find(t => t.v === activeTab)?.label} checklist</SecTitle>
        {CHECKLISTS[activeTab].map((item, i) => (
          <CheckItem key={i} label={item} tab={activeTab} idx={i} />
        ))}
      </Card>

      {/* Net proceeds reminder */}
      <Card>
        <View style={{ padding: 14, backgroundColor: C.amberLight, borderRadius: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.amber, textTransform: "uppercase", letterSpacing: 0.5 }}>Estimated net proceeds</Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: C.amber, marginTop: 4 }}>{fmt(proceeds)}</Text>
        </View>
      </Card>

      <NavButtons onBack={onBack} nextLabel="Done" onNext={() => { onDone && onDone(); onSwitchMode && onSwitchMode(null); }} accent={C.amber} />

    </ScrollView>
  );
}
