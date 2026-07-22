import { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../lib/theme";
import { mpi, convRate, fmt, fmtK } from "../lib/math";
import { federalTax, ficaTax } from "../lib/tax";
import { stateTax } from "../lib/stateTax";
import { getPropTaxRate, getInsuranceRate, getUtilities } from "../lib/data";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function PBar({ value, max, color }) {
  const C = useTheme();
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginVertical: 4 }}>
      <View style={{ height: "100%", borderRadius: 99, width: `${pct * 100}%`, backgroundColor: color }} />
    </View>
  );
}

function RatioRow({ label, value, limit, limitLabel, color }) {
  const C = useTheme();
  const ok = value <= limit;
  const border = value <= limit ? C.green : value <= limit + 5 ? C.amber : C.red;
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={{ fontSize: 12, color: C.gray700, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "900", color: border }}>{value}%</Text>
      </View>
      <PBar value={value} max={55} color={border} />
      <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>
        {limitLabel} — {ok ? "✓ Good" : value <= limit + 5 ? "⚠ Borderline" : "✗ Over limit"}
      </Text>
    </View>
  );
}

export default function RatiosScreen({ data, onNext, onBack, programs: allP = [], rates = {} }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "";
  const ar = d.loanType === "fha" ? (rates.fha30 || 6.73)
           : d.loanType === "va"  ? (rates.va30  || 6.54)
           : convRate(d.score, d.dpPct, rates.conv30 || 6.51);
  const dp = d.price * d.dpPct / 100;

  const progMap = useMemo(() => new Map(allP.map(p => [p.id, p])), [allP]);
  const totalAssist = useMemo(() =>
    (d.programs || []).reduce((s, id) => { const p = progMap.get(id); return p ? s + p.calc(d.price) : s; }, 0),
    [d.programs, d.price, progMap]);

  const fhaUp = d.loanType === "fha" ? (d.price - dp) * 0.0175 : 0;
  const cashNeeded = dp + d.price * 0.03 + 1000 + fhaUp;
  const assistPrin = Math.max(0, totalAssist - cashNeeded);
  const effLoan = (d.price - dp) - assistPrin;

  let miMo = 0;
  if (d.loanType === "fha") miMo = Math.round(effLoan * 0.0055 / 12);
  else if (d.loanType === "conv") {
    const pr = d.score >= 780 ? .002 : d.score >= 760 ? .003 : d.score >= 740 ? .004 : d.score >= 720 ? .006 : .009;
    miMo = d.dpPct < 20 ? Math.round(effLoan * pr / 12) : 0;
  }
  const piMo = Math.round(mpi(effLoan, ar, 360));
  const txMo  = Math.round(d.price * getPropTaxRate(st) / 12);
  const insMo = Math.round(d.price * getInsuranceRate(st) / 12);
  const piti  = piMo + txMo + insMo + miMo;
  const grossMo = Math.round(d.income / 12);
  const fe = grossMo > 0 ? Math.round(piti / grossMo * 100) : 0;
  const be = grossMo > 0 ? Math.round((piti + (d.debts || 0) + (d.student || 0)) / grossMo * 100) : 0;

  const pretax = (d.k401 || 0) + (d.hsa || 0) + (d.ira || 0);
  const status = d.filingStatus || "single";
  const fedTaxYr = federalTax({ gross: d.income, pretax, status });
  const ficaYr = ficaTax(d.income, status);
  const stateTaxYr = stateTax(st, Math.max(0, d.income - pretax));
  const taxFICA = Math.round((fedTaxYr + ficaYr + stateTaxYr) / 12);
  const rothMo = Math.round((d.roth || 0) / 12);
  const pretaxMo = Math.round(pretax / 12);
  const trueTakeHome = grossMo - taxFICA - pretaxMo - rothMo;

  const hoa   = d.price < 280000 ? 0 : d.price < 340000 ? 55 : d.price < 400000 ? 120 : 175;
  const maint = Math.round(d.price * 0.01 / 12);
  const utils = getUtilities(st);
  const housing = piti + utils + hoa + maint;
  const personal = (d.groc || 0) + (d.dining || 0) + (d.ent || 0) + (d.pcare || 0) + (d.car || 0) + (d.debts || 0) + (d.student || 0) + (d.efund || 0) + (d.childcare || 0) + (d.healthcare || 0) + (d.education || 0) + (d.misc || 0);
  const mccMo = (d.programs || []).some(p => p.includes("mcc")) ? Math.round(piMo * 12 * .15 / 12) : 0;
  const remaining = trueTakeHome - housing - personal + mccMo;
  const bufCol = remaining >= 500 ? C.green : remaining >= 100 ? C.amber : C.red;
  const bufBg  = remaining >= 500 ? C.greenPale : remaining >= 100 ? C.amberLight : C.redLight;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Card>
        <SecTitle>Underwriting ratios</SecTitle>

        {/* Quick stats row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Your Rate",   value: ar.toFixed(2) + "%", bg: C.greenPale,  color: C.green },
            { label: "Est. PITI",   value: fmt(piti) + "/mo",   bg: fe <= 28 ? C.greenPale : fe <= 33 ? C.amberLight : C.redLight, color: fe <= 28 ? C.green : fe <= 33 ? C.amber : C.red },
            { label: "Eff. Loan",   value: fmtK(effLoan),       bg: C.gray100,    color: C.charcoal },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, borderRadius: 10, padding: 10, alignItems: "center", backgroundColor: s.bg }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: C.gray500, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: s.color }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* DTI rows */}
        <RatioRow label="Front-end DTI — housing only" value={fe} limit={28} limitLabel="28% guideline (Fannie Mae / FHA standard)" />
        <RatioRow label="Back-end DTI — all debts + housing" value={be} limit={43} limitLabel="36% ideal · 43% lender max · 50% with compensating factors" />

        {/* PITI breakdown */}
        <View style={{ backgroundColor: C.gray100, borderRadius: 10, padding: 12, marginBottom: 12, gap: 5 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>PITI breakdown</Text>
          {[
            { l: "Principal & Interest", v: fmt(piMo) + "/mo" },
            { l: `Property tax (est. ${(getPropTaxRate(st)*100).toFixed(2)}%)`, v: fmt(txMo) + "/mo" },
            { l: `Homeowners insurance (est. ${(getInsuranceRate(st)*100).toFixed(2)}%)`, v: fmt(insMo) + "/mo" },
            miMo > 0 && { l: "PMI / MIP", v: fmt(miMo) + "/mo", red: true },
          ].filter(Boolean).map(r => (
            <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: C.gray700 }}>{r.l}</Text>
              <Text style={{ fontSize: 11, fontWeight: "700", color: r.red ? C.red : C.charcoal }}>{r.v}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.gray300, paddingTop: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "800", color: C.charcoal }}>Total PITI</Text>
            <Text style={{ fontSize: 12, fontWeight: "900", color: fe <= 28 ? C.green : C.red }}>{fmt(piti)}/mo · {fe}% of gross</Text>
          </View>
        </View>

        {/* Existing debts impact */}
        {((d.debts || 0) + (d.student || 0)) > 0 && (
          <View style={{ backgroundColor: C.gray100, borderRadius: 10, padding: 12, marginBottom: 12, gap: 5 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Existing debts counted in back-end DTI</Text>
            {(d.student || 0) > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: C.gray700 }}>Student loans</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.red }}>{fmt(d.student)}/mo</Text>
              </View>
            )}
            {(d.debts || 0) > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: C.gray700 }}>Other debts</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.red }}>{fmt(d.debts)}/mo</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.gray300, paddingTop: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: C.charcoal }}>Total back-end</Text>
              <Text style={{ fontSize: 11, fontWeight: "900", color: be <= 43 ? C.charcoal : C.red }}>{fmt(piti + (d.debts || 0) + (d.student || 0))}/mo · {be}%</Text>
            </View>
          </View>
        )}

        {/* Status alerts */}
        {be > 43 && <Alert type="danger">Back-end DTI is {be}% — over the 43% lender max. Most conventional lenders will decline. Reduce your target price, increase your down payment, or pay down {fmt(Math.round(((be - 43) / 100) * grossMo))} in monthly debts.</Alert>}
        {be > 36 && be <= 43 && <Alert type="warning">Back-end DTI is {be}% — above the 36% ideal but under the 43% max. Some lenders approve with compensating factors: high credit score ({d.score}+), large reserves, or stable employment history.</Alert>}
        {fe > 28 && be <= 36 && <Alert type="warning">Front-end DTI is {fe}% — above the 28% housing guideline. Adding {fmt(Math.round(((fe - 28) / 100) * grossMo * 12))} more to your down payment this year would bring it in range.</Alert>}
        {fe <= 28 && be <= 36 && <Alert type="success">Both ratios are within standard guidelines. Front-end {fe}% (under 28%) and back-end {be}% (under 36%) — you're in strong qualifying territory.</Alert>}
      </Card>

      <Card>
        <SecTitle>Monthly breakdown</SecTitle>
        {[
          { l: "Gross monthly income",   v: fmt(grossMo),      c: C.green },
          { l: "Pre-tax deductions",     v: `- ${fmt(pretaxMo)}`, c: C.red },
          { l: `Federal${st && stateTaxYr > 0 ? " + " + st + " state" : ""} + FICA tax`, v: `- ${fmt(taxFICA)}`, c: C.red },
          { l: "True take-home",         v: fmt(trueTakeHome), c: C.green, bold: true },
          { l: "" },
          { l: "Principal & Interest",   v: fmt(piMo) + "/mo", c: C.charcoal },
          { l: "Property tax (est.)",    v: fmt(txMo) + "/mo",  c: C.charcoal },
          { l: "Insurance (est.)",       v: fmt(insMo) + "/mo", c: C.charcoal },
          miMo > 0 && { l: "PMI / MIP",         v: fmt(miMo) + "/mo",  c: C.red },
          hoa > 0  && { l: "HOA",               v: fmt(hoa)  + "/mo",  c: C.charcoal },
          { l: "Utilities + maintenance",v: fmt(utils + maint)+ "/mo", c: C.charcoal },
          { l: "Total housing",          v: fmt(housing) + "/mo", c: C.charcoal, bold: true },
          { l: "" },
          { l: "Lifestyle & debts",      v: fmt(personal) + "/mo", c: C.charcoal },
        ].filter(Boolean).map((row, i) => {
          if (!row.l) return <View key={i} style={{ height: 8 }} />;
          return (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: C.gray700, flex: 1 }}>{row.l}</Text>
              <Text style={{ fontSize: 12, fontWeight: row.bold ? "900" : "600", color: row.c }}>{row.v}</Text>
            </View>
          );
        })}
        <View style={{ borderTopWidth: 2, borderTopColor: C.gray100, marginTop: 8, paddingTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: bufBg, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: bufCol }}>Monthly buffer</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: bufCol }}>{remaining >= 0 ? "+" : ""}{fmt(remaining)}/mo</Text>
        </View>
        {mccMo > 0 && (
          <View style={{ backgroundColor: C.greenPale, borderRadius: 8, padding: 10, marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, color: C.green }}>MCC tax credit (at filing)</Text>
            <Text style={{ fontSize: 11, fontWeight: "800", color: C.green }}>+ {fmt(mccMo * 12)}/yr</Text>
          </View>
        )}
      </Card>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>See Results →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["DTI", "PITI", "PMI", "MIP", "MCC", "HOA"]} />

    </ScrollView>
  );
}
