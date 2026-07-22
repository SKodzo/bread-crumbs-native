import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { mpi, convRate, getLoanRec, fmt, fmtK } from "../lib/math";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function PBar({ value, max, color }) {
  const C = useTheme();
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ height: 6, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginVertical: 4 }}>
      <View style={{ height: "100%", borderRadius: 99, width: `${pct * 100}%`, backgroundColor: color }} />
    </View>
  );
}

const LOANS = [
  { id: "fha",  name: "FHA Loan",      emoji: "🏛️", pros: ["3.5% minimum down", "Accessible 580+ credit", "Flexible qualification"], cons: ["Lifetime MIP < 10% down", "1.75% upfront MIP", "Stricter property rules"] },
  { id: "conv", name: "Conventional",  emoji: "🏦", pros: ["PMI cancels at 20%", "Lower long-term cost", "No upfront insurance"],    cons: ["620+ credit required", "Higher score = better rate", "Larger reserves needed"] },
  { id: "va",   name: "VA Loan",       emoji: "🎖️", pros: ["$0 down payment", "No PMI ever", "Lowest available rate"],              cons: ["Veterans & active duty", "VA funding fee", "Need Certificate of Eligibility"] },
];

const TERMS = [
  { id: 360,    label: "30-yr fixed", note: "Lowest monthly payment", note2: null,           arm: false },
  { id: 180,    label: "15-yr fixed", note: "Less interest, higher payment", note2: null,    arm: false },
  { id: "5arm", label: "5/1 ARM",     note: "Fixed rate for 5 years, then adjusts annually", note2: "Rate can rise based on market index — payment may increase after year 5", arm: true },
  { id: "7arm", label: "7/1 ARM",     note: "Fixed rate for 7 years, then adjusts annually", note2: "Rate can rise based on market index — payment may increase after year 7", arm: true },
];

export default function LoanScreen({ data, setData, onNext, onBack, hud = {}, rates = {} }) {
  const [dpKey] = useState(() => `dp_${data.dpPct}`);
  const C = useTheme();
  const d = data;
  const rec = getLoanRec(d.score, d.dpPct, d.isVet);
  const FR = rates.fha30  || 6.48;
  const VR = rates.va30   || 6.17;
  const CR = convRate(d.score, d.dpPct, rates.conv30 || 6.51);
  const fhaLimit = hud.fhaLimit || 498257;
  const loanAmt  = d.price * (1 - d.dpPct / 100);
  const exceedsFHA = d.loanType === "fha" && loanAmt > fhaLimit;
  const ar = d.loanType === "fha" ? FR : d.loanType === "va" ? VR : CR;
  const loan = d.price * (1 - d.dpPct / 100);
  const effMo = d.loanTerm === "5arm" || d.loanTerm === "7arm" ? 360 : (d.loanTerm || 360);
  const piti = Math.round(mpi(loan, ar, effMo) + d.price * 0.022 / 12 + d.price * 0.012 / 12);
  const fe = Math.round(piti / (d.income / 12) * 100);
  const be = Math.round((piti + (d.debts || 0) + (d.student || 0)) / (d.income / 12) * 100);

  useEffect(() => {
    if (d.loanType !== rec.type) setData({ ...d, loanType: rec.type });
  }, [d.score, d.dpPct, d.isVet]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Alert type="info">
        <Text style={{ fontWeight: "700" }}>Auto-recommendation:</Text> Based on {d.score} credit score and {d.dpPct}% down — we recommend <Text style={{ fontWeight: "700" }}>{rec.type.toUpperCase()}</Text>. {rec.reason}
      </Alert>

      {/* County FHA loan limit */}
      <View style={{ backgroundColor: C.blueLight || "#DBEAFE", borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.blue || "#1D4ED8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {hud.county ? `${hud.county} County` : "County"} FHA Limit · HUD {hud.hudYear || new Date().getFullYear()}
          </Text>
          <Text style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>Max loan size for an FHA-insured mortgage in your area</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "900", color: C.blue || "#1D4ED8" }}>{fmt(fhaLimit)}</Text>
      </View>

      {exceedsFHA && (
        <Alert type="danger">
          Your loan amount ({fmt(loanAmt)}) exceeds the {hud.county || "county"} FHA limit of {fmt(fhaLimit)}. Lower your price, increase your down payment, or switch to a conventional loan.
        </Alert>
      )}

      {/* Veteran toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 12 }}>
        <Text style={{ fontSize: 12, color: C.gray700, fontWeight: "600" }}>Veteran / Active duty?</Text>
        <TouchableOpacity
          onPress={() => setData({ ...d, isVet: !d.isVet })}
          style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5, borderColor: d.isVet ? C.green : C.gray300, backgroundColor: d.isVet ? C.green : C.card }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: d.isVet ? C.white : C.gray700 }}>{d.isVet ? "✓ Yes — show VA option" : "No"}</Text>
        </TouchableOpacity>
      </View>

      {/* Loan type cards */}
      <View style={{ gap: 10, marginBottom: 14 }}>
        {LOANS.filter(ln => ln.id !== "va" || d.isVet).map(ln => {
          const rate = ln.id === "fha" ? FR : ln.id === "va" ? VR : CR;
          const isSel = d.loanType === ln.id;
          const isRec = ln.id === rec.type;
          return (
            <TouchableOpacity
              key={ln.id}
              onPress={() => setData({ ...d, loanType: ln.id })}
              style={{ borderWidth: isSel ? 2 : 1.5, borderColor: isSel ? C.green : C.gray300, borderRadius: 14, padding: 14, backgroundColor: isSel ? C.greenLight : C.card }}
              activeOpacity={0.7}
            >
              {isRec && (
                <View style={{ backgroundColor: C.amber, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: C.white }}>⭐ RECOMMENDED FOR YOU</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{ln.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: C.charcoal, marginBottom: 2 }}>{ln.name}</Text>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: isSel ? C.green : C.charcoal, marginBottom: 8 }}>{rate.toFixed(2)}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {ln.pros.map((p, i) => <Text key={i} style={{ fontSize: 11, color: C.green, marginBottom: 2 }}>✓ {p}</Text>)}
                  {ln.cons.map((p, i) => <Text key={i} style={{ fontSize: 11, color: C.gray500, marginBottom: 2 }}>✗ {p}</Text>)}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loan settings — down payment + term in one card */}
      <Card>
        <SecTitle>Loan settings</SecTitle>

        {/* Down payment */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Down payment %</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: C.green }}>{d.dpPct}%</Text>
        </View>
        <Slider
          key={dpKey}
          style={{ width: "100%", height: 36 }}
          minimumValue={0} maximumValue={d.isFirstTime === false ? 50 : 25} step={1}
          value={d.dpPct}
          onValueChange={v => setData({ ...d, dpPct: v })}
          minimumTrackTintColor={C.green}
          maximumTrackTintColor={C.gray300}
          thumbTintColor={C.green}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginBottom: 18 }}>
          <Text style={{ fontSize: 11, color: C.gray500 }}>{d.dpPct >= 20 ? "No PMI required ✓" : d.dpPct >= 10 ? "Reduced PMI" : "PMI / MIP applies"}</Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: C.charcoal }}>{fmt(d.price * d.dpPct / 100)}</Text>
        </View>

        {/* Loan term */}
        <Text style={{ fontSize: 11, fontWeight: "800", color: C.green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Loan term</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TERMS.map(t => {
            const sel = (d.loanTerm || 360) === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setData({ ...d, loanTerm: t.id })}
                style={{ flex: 1, minWidth: "45%", borderWidth: 2, borderColor: sel ? (t.arm ? C.amber : C.green) : C.gray300, borderRadius: 10, padding: 10, backgroundColor: sel ? (t.arm ? C.amberLight : C.greenLight) : C.card }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: sel ? C.green : C.charcoal }}>{t.label}</Text>
                <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{t.note}</Text>
                {t.note2 && (
                  <Text style={{ fontSize: 10, color: C.amber, marginTop: 3, fontWeight: "600" }}>{t.note2}</Text>
                )}
                {t.arm && sel && (
                  <View style={{ marginTop: 8, backgroundColor: C.amberLight, borderRadius: 6, padding: 6, borderWidth: 1, borderColor: C.amber }}>
                    <Text style={{ fontSize: 10, color: C.amber, lineHeight: 15 }}>ARM rates adjust after the fixed period. Only choose this if you plan to sell or refinance before adjustment.</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Repeat buyer: timing your purchase */}
      {d.isFirstTime === false && (
        <Card>
          <SecTitle>Timing your purchase</SecTitle>
          <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>Do you plan to sell your current home before or after buying the new one?</Text>
          <View style={{ gap: 8 }}>
            {[
              { v: true, emoji: "🏠→🔑", label: "Sell first, then buy", sub: "Stronger offer, no bridge loan needed, but you'll need temporary housing" },
              { v: false, emoji: "🔑→🏠", label: "Buy first, then sell", sub: "No housing gap, but you'll carry two mortgages temporarily — ask about bridge loans" },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.v)}
                onPress={() => setData({ ...d, sellFirst: opt.v })}
                style={{
                  borderWidth: 2, borderRadius: 12, padding: 14,
                  borderColor: d.sellFirst === opt.v ? C.green : C.gray300,
                  backgroundColor: d.sellFirst === opt.v ? C.greenLight : C.card,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, marginBottom: 4 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: d.sellFirst === opt.v ? C.green : C.charcoal }}>{opt.label}</Text>
                <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4, lineHeight: 16 }}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {d.sellFirst === false && (
            <Alert type="warning">Lenders will count both mortgage payments in your DTI until the current home sells. Ask your lender about bridge loan options or a HELOC on your current home.</Alert>
          )}
          {d.sellFirst === true && (
            <Alert type="info">Budget for 1–3 months of temporary housing and storage costs between your sale closing and new purchase.</Alert>
          )}
        </Card>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Continue →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["FHA", "VA", "PMI", "MIP", "PITI", "DTI", "ARM"]} />

    </ScrollView>
  );
}
