import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { getPropTaxRate } from "../../lib/data";
import { SliderRow, Card, SecTitle, Alert, NavButtons } from "../../components/UI";

const COMMISSION_MODELS = [
  { v: "traditional", label: "Traditional agent", range: "5–6%", icon: "🏠", defaultPct: 5.5 },
  { v: "flat", label: "Flat-fee / discount", range: "3–4%", icon: "💲", defaultPct: 3.5 },
  { v: "fsbo", label: "FSBO (by owner)", range: "0–3%", icon: "📋", defaultPct: 2 },
];

// Transfer tax rates per $1000 of sale price (only states with meaningful rates)
const TRANSFER_TAX_RATE = {
  NY: 4.0, CA: 1.1, PA: 10.0, DC: 14.0, MD: 5.0, NJ: 5.85, CT: 7.5,
  WA: 1.78, IL: 1.0, VA: 1.0, DE: 4.0, NH: 7.5, VT: 6.25, HI: 1.0,
  MA: 4.56, RI: 4.6, MN: 3.3, WI: 3.0, MI: 8.6, NV: 2.55,
};

// Rough closing cost components by state category
const closingCosts = (st, homeValue) => {
  const propTaxRate = getPropTaxRate(st);
  const proratedTax = Math.round(homeValue * propTaxRate / 2); // ~6 months prorated
  const titleInsurance = Math.round(homeValue * 0.005);
  const escrow = Math.round(homeValue * 0.01);
  const recording = 250;
  const transferRate = TRANSFER_TAX_RATE[st] || 0;
  const transferTax = Math.round(homeValue / 1000 * transferRate);
  return { titleInsurance, escrow, proratedTax, recording, transferTax, transferRate };
};

export default function SellerCostsScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "TX";
  const commType = d.commissionType || "traditional";
  const commPct = d.commissionPct || 5.5;
  const commDollars = Math.round((d.homeValue || 0) * commPct / 100);

  const cc = closingCosts(st, d.homeValue || 0);
  const totalClosing = cc.titleInsurance + cc.escrow + cc.proratedTax + cc.recording + cc.transferTax;

  const repairs = d.repairs || 0;
  const staging = d.staging || 0;
  const photography = d.photography || 0;
  const totalPrep = repairs + staging + photography;

  const totalCosts = commDollars + totalClosing + totalPrep;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Commission model */}
      <Card>
        <SecTitle>Commission model</SecTitle>
        <View style={{ gap: 6 }}>
          {COMMISSION_MODELS.map(m => (
            <TouchableOpacity
              key={m.v}
              onPress={() => setData({ ...d, commissionType: m.v, commissionPct: m.defaultPct })}
              style={{ flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 10, padding: 12, gap: 10, borderColor: commType === m.v ? C.amber : C.gray300, backgroundColor: commType === m.v ? C.amberLight : C.card }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: commType === m.v ? C.amber : C.charcoal }}>{m.label}</Text>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Typical: {m.range}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Commission slider */}
      <Card>
        <SecTitle>Commission rate</SecTitle>
        <SliderRow
          label="Commission %"
          value={commPct}
          min={0} max={10} step={0.25}
          display={commPct.toFixed(1) + "%"}
          color={C.amber}
          onChange={v => setData({ ...d, commissionPct: v })}
        />
        <View style={{ marginTop: 8, padding: 10, backgroundColor: C.amberLight, borderRadius: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray500 }}>Commission on {fmt(d.homeValue)}</Text>
          <Text style={{ fontSize: 20, fontWeight: "900", color: C.amber }}>{fmt(commDollars)}</Text>
        </View>
      </Card>

      {/* Closing costs table */}
      <Card>
        <SecTitle>Seller closing costs ({st})</SecTitle>
        {[
          { label: "Title insurance", value: cc.titleInsurance, tag: "Title company est." },
          { label: "Escrow / settlement", value: cc.escrow, tag: "Brokerage/escrow est." },
          { label: "Prorated property tax (~6 mo)", value: cc.proratedTax, tag: "County property tax est." },
          { label: "Recording fees", value: cc.recording, tag: "Municipal gov. fee" },
          { label: `Transfer tax${cc.transferRate ? ` ($${cc.transferRate}/$1K)` : ""}`, value: cc.transferTax, tag: cc.transferRate ? "State transfer tax (gov.)" : `No transfer tax in ${st}` },
        ].map((row, i) => (
          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: C.gray200 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: C.charcoal, flex: 1 }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{fmt(row.value)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.gray400, marginTop: 1 }}>{row.tag}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: C.charcoal }}>Total closing costs</Text>
          <Text style={{ fontSize: 14, fontWeight: "900", color: C.amber }}>{fmt(totalClosing)}</Text>
        </View>
      </Card>

      {/* Pre-sale prep */}
      <Card>
        <SecTitle>Pre-sale prep</SecTitle>
        <SliderRow
          label="Repairs"
          value={repairs}
          min={0} max={20000} step={500}
          display={fmt(repairs)}
          color={C.amber}
          onChange={v => setData({ ...d, repairs: v })}
        />
        <SliderRow
          label="Staging"
          value={staging}
          min={0} max={5000} step={250}
          display={fmt(staging)}
          color={C.amber}
          onChange={v => setData({ ...d, staging: v })}
        />
        <SliderRow
          label="Photography"
          value={photography}
          min={0} max={2000} step={100}
          display={fmt(photography)}
          color={C.amber}
          onChange={v => setData({ ...d, photography: v })}
        />
      </Card>

      {/* Total costs summary */}
      <Card>
        <View style={{ padding: 14, backgroundColor: C.amberLight, borderRadius: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.amber, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Total selling costs</Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: C.amber, textAlign: "center", marginTop: 4 }}>{fmt(totalCosts)}</Text>
          <View style={{ marginTop: 10, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: C.gray500 }}>Commission</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{fmt(commDollars)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: C.gray500 }}>Closing costs</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{fmt(totalClosing)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: C.gray500 }}>Pre-sale prep</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{fmt(totalPrep)}</Text>
            </View>
          </View>
        </View>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Net proceeds →" color={C.amber} />

    </ScrollView>
  );
}
