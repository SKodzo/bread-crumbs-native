import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { fmt, fmtK, calcSaleProceeds } from "../lib/math";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function SliderRow({ label, min, max, step, value, onChange, display, note, color }) {
  const C = useTheme();
  const trackColor = color || C.green;
  const [mountKey] = useState(() => `${min}_${max}_${value}`);
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: display && display.length > 9 ? 17 : 22, fontWeight: "900", color: trackColor }}>{display}</Text>
      </View>
      <Slider
        key={mountKey}
        style={{ width: "100%", height: 36 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={C.gray300}
        thumbTintColor={trackColor}
      />
      {note ? <Text style={{ fontSize: 11, color: C.gray500, marginTop: -4 }}>{note}</Text> : null}
    </View>
  );
}

function BigNum({ label, value, color, sub, bg }) {
  const C = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: 10, padding: 10, alignItems: "center", backgroundColor: bg || C.gray100 }}>
      <Text style={{ fontSize: 9, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4, textAlign: "center" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "900", textAlign: "center", color }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 9, color: C.gray500, marginTop: 2, textAlign: "center" }}>{sub}</Text> : null}
    </View>
  );
}

function PBar({ value, max, color }) {
  const C = useTheme();
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ height: 6, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginVertical: 4 }}>
      <View style={{ height: "100%", borderRadius: 99, width: `${pct * 100}%`, backgroundColor: color }} />
    </View>
  );
}

function AffordabilityComparison({ data }) {
  const C = useTheme();
  const d = data;
  const grossMo = Math.round((d.income || 0) / 12);
  const dpPct   = d.dpPct || 5;
  const dpFrac  = dpPct / 100;
  const wantedLoan = Math.round(d.price * (1 - dpFrac));

  // Back-solve max loan using a conservative 7% benchmark rate over 30 yr
  const r = 0.07 / 12;
  const mpiDiv = r / (1 - Math.pow(1 + r, -360)); // payment per $1 of loan
  // Taxes + insurance ≈ 3.4%/yr of purchase price, proportional to loan
  const tiDiv = 0.034 / 12 / (1 - dpFrac);

  // 28% front-end: max loan where PITI ≤ 28% gross monthly
  const feMaxLoan = Math.round((grossMo * 0.28) / (mpiDiv + tiDiv));

  // 36% back-end: subtract existing debts, solve for remaining housing room
  const existingDebts = (d.debts || 0) + (d.student || 0);
  const beMaxLoan = Math.round(
    Math.max(0, grossMo * 0.36 - existingDebts) / (mpiDiv + tiDiv)
  );

  // Conservative max = lower of front-end and back-end results
  const recMaxLoan = Math.min(feMaxLoan, beMaxLoan);
  const gap        = wantedLoan - recMaxLoan;
  const isOver     = gap > 0;

  // Bar: show both values on same scale, cap visual at 1.5× rec for readability
  const barMax     = Math.max(wantedLoan, recMaxLoan) * 1.08;
  const wantedPct  = Math.min((wantedLoan / barMax) * 100, 100);
  const recPct     = Math.min((recMaxLoan / barMax) * 100, 100);

  const wantedColor = isOver ? C.red : C.green;
  const limitColor  = C.green;

  return (
    <Card>
      <SecTitle>Target vs. Underwriting Reality</SecTitle>
      <Text style={{ fontSize: 12, color: C.gray500, marginBottom: 14, lineHeight: 18 }}>
        Based on a conservative 7% benchmark rate, 28% front-end DTI cap, and 36% back-end DTI cap.
      </Text>

      {/* Side-by-side stat boxes */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 12, padding: 14, backgroundColor: isOver ? C.redLight : C.greenPale, borderWidth: 2, borderColor: wantedColor }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: wantedColor, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Your Target Loan</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: wantedColor }}>{fmtK(wantedLoan)}</Text>
          <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{dpPct}% down on {fmt(d.price)}</Text>
        </View>
        <View style={{ flex: 1, borderRadius: 12, padding: 14, backgroundColor: C.greenPale, borderWidth: 2, borderColor: C.green }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.green, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Recommended Max</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: C.green }}>{fmtK(recMaxLoan)}</Text>
          <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{beMaxLoan < feMaxLoan ? "36% back-end limit" : "28% front-end limit"}</Text>
        </View>
      </View>

      {/* Comparison bar */}
      <Text style={{ fontSize: 10, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Loan size comparison</Text>
      <View style={{ position: "relative", height: 36, marginBottom: 4 }}>
        {/* Recommended bar (green baseline) */}
        <View style={{ position: "absolute", left: 0, top: 8, height: 20, width: `${recPct}%`, backgroundColor: C.green, borderRadius: 6, opacity: 0.25 }} />
        <View style={{ position: "absolute", left: 0, top: 8, height: 20, width: `${recPct}%`, borderRadius: 6, borderWidth: 2, borderColor: C.green }} />
        {/* Wanted bar */}
        <View style={{ position: "absolute", left: 0, top: isOver ? 14 : 8, height: isOver ? 8 : 20, width: `${wantedPct}%`, backgroundColor: wantedColor, borderRadius: 6, opacity: isOver ? 0.85 : 0.6 }} />
        {/* Labels */}
        <Text style={{ position: "absolute", left: `${recPct}%`, top: 0, fontSize: 8, fontWeight: "700", color: C.green, transform: [{ translateX: -10 }] }}>MAX</Text>
        {isOver && (
          <Text style={{ position: "absolute", left: `${wantedPct}%`, top: 0, fontSize: 8, fontWeight: "700", color: C.red, transform: [{ translateX: -20 }] }}>TARGET</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={{ fontSize: 10, color: C.gray500 }}>$0</Text>
        <Text style={{ fontSize: 10, color: C.gray500 }}>{fmtK(barMax)}</Text>
      </View>

      {/* DTI breakdown */}
      <View style={{ backgroundColor: C.gray100, borderRadius: 10, padding: 12, marginBottom: 12, gap: 6 }}>
        {[
          { l: "28% front-end max loan", v: fmtK(feMaxLoan), ok: wantedLoan <= feMaxLoan },
          { l: "36% back-end max loan",  v: fmtK(beMaxLoan),  ok: wantedLoan <= beMaxLoan },
          { l: "Conservative max",       v: fmtK(recMaxLoan), ok: !isOver, bold: true },
        ].map(r => (
          <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: C.gray700, fontWeight: r.bold ? "800" : "400" }}>{r.l}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: r.ok ? C.green : C.red }}>{r.v}</Text>
              <Text style={{ fontSize: 10, color: r.ok ? C.green : C.red }}>{r.ok ? "✓" : "✗"}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Status alert */}
      <Alert type={isOver ? "danger" : "success"}>
        {isOver
          ? <Text><Text style={{ fontWeight: "900" }}>⚠ Target loan exceeds conservative benchmarks by {fmtK(gap)}.</Text>{" "}Consider a lower price, larger down payment, or paying down existing debts to improve your DTI.</Text>
          : <Text><Text style={{ fontWeight: "900" }}>✓ Your target loan fits comfortably within standard lending guidelines.</Text>{" "}You're within both the 28% front-end and 36% back-end DTI thresholds.</Text>
        }
      </Alert>
    </Card>
  );
}

export default function HomeScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const income = d.income || 1;
  const m = (d.price / income).toFixed(1);
  const mc = m <= 3.5 ? C.green : m <= 4.5 ? C.amber : C.red;
  const mLabel = m <= 3 ? "conservative" : m <= 4 ? "comfortable" : m <= 5 ? "stretch" : "aggressive";

  const ranges = [
    { l: "Conservative (2.5–3×)", max: income * 3,  col: C.green,    desc: "A safe budget that leaves plenty of room for savings, travel, and unexpected expenses without stretching your monthly income." },
    { l: "Comfortable (3–4×)",    max: income * 4,  col: C.greenMid, desc: "The standard benchmark for most buyers. Covers your housing costs reliably while maintaining a balanced lifestyle." },
    { l: "Stretch (4–5×)",        max: income * 5,  col: C.amber,    desc: "Aggressive territory. This requires a tighter budget elsewhere and leaves less breathing room for other financial goals." },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Card>
        <SecTitle>Target price</SecTitle>
        <SliderRow
          label="Purchase price"
          min={0} max={2000000} step={5000}
          value={d.price}
          onChange={v => setData({ ...d, price: v })}
          display={fmt(d.price)}
          note={`${m}× income — ${mLabel}`}
          color={mc}
        />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <BigNum label="Down payment" value={fmt(d.price * (d.dpPct || 5) / 100)} color={C.green} bg={C.greenPale} />
          <BigNum label="Income multiple" value={m + "×"} color={mc} sub={m <= 3.5 ? "comfortable" : m <= 4.5 ? "manageable" : "stretch"} bg={m <= 3.5 ? C.greenPale : m <= 4.5 ? C.amberLight : C.redLight} />
          <BigNum label="Loan amount" value={fmtK(d.price * (1 - (d.dpPct || 5) / 100))} color={C.charcoal} bg={C.gray100} />
        </View>
      </Card>

      {d.isFirstTime === false && (d.currentHomeValue || 0) > 0 && (() => {
        const sp = calcSaleProceeds(d.currentHomeValue, d.currentMortgageBalance || 0);
        const total = sp + (d.savings || 0);
        return (
          <Card style={{ borderWidth: 1, borderColor: C.green }}>
            <SecTitle>Your buying power</SecTitle>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.gray700 }}>Home sale proceeds</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>{fmt(sp)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.gray700 }}>Liquid savings</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>{fmt(d.savings || 0)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 4 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: C.text }}>Total available</Text>
                <Text style={{ fontSize: 16, fontWeight: "900", color: C.green }}>{fmt(total)}</Text>
              </View>
            </View>
          </Card>
        );
      })()}

      <AffordabilityComparison data={data} />

      <Card>
        <SecTitle>Affordability ranges</SecTitle>
        {ranges.map(t => (
          <View key={t.l} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>{t.l}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>up to {fmt(t.max)}</Text>
            </View>
            <PBar value={Math.min(d.price, t.max)} max={t.max} color={d.price <= t.max ? t.col : C.red} />
            <Text style={{ fontSize: 10, color: C.gray500, marginTop: 4, lineHeight: 15 }}>{t.desc}</Text>
          </View>
        ))}
      </Card>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 24 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Continue →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["DPA", "AMI", "PMI", "MIP", "PITI", "HOA"]} />

    </ScrollView>
  );
}
