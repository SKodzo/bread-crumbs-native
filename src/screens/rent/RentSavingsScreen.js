import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { federalTax, ficaTax } from "../../lib/tax";
import { stateTax } from "../../lib/stateTax";
import { getUtilities } from "../../lib/data";
import { Card, SecTitle, Alert, SliderRow, NavButtons } from "../../components/UI";

const DISCRETIONARY_KEYS = [
  { key: "dining", label: "Dining out", cutPct: 0.5 },
  { key: "ent", label: "Entertainment", cutPct: 0.5 },
  { key: "pcare", label: "Personal care", cutPct: 0.4 },
  { key: "misc", label: "Misc", cutPct: 0.5 },
  { key: "groc", label: "Groceries", cutPct: 0.2 },
  { key: "car", label: "Car / transport", cutPct: 0.15 },
];

export default function RentSavingsScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "";
  const status = d.filingStatus || "single";
  const grossYr = d.income || 0;
  const grossMo = Math.round(grossYr / 12);
  const fedTaxYr = federalTax({ gross: grossYr, status });
  const ficaYr = ficaTax(grossYr, status);
  const stateTaxYr = stateTax(st, grossYr);
  const taxMo = Math.round((fedTaxYr + ficaYr + stateTaxYr) / 12);
  const takeHome = grossMo - taxMo;

  const standardTier = Math.round(grossMo * 0.30);
  const splitCount = (d.roommates || 0) + 1;

  const [targetRent, setTargetRent] = useState(d.targetRent || standardTier);

  // Gap analysis
  const standardShare = Math.round(standardTier / splitCount);
  const targetShare = Math.round(targetRent / splitCount);
  const gap = targetShare - standardShare;

  // Move-in cash needed — read values set by user in Step 3
  const depositMonths  = d.depositMonths ?? 1;
  const depositAmt     = Math.round(targetRent * depositMonths);
  const appFeePerPerson = d.appFeeOverride ?? 75;
  const appFeeTotal    = appFeePerPerson * splitCount;
  const adminFee       = d.adminFee ?? 200;
  const petDeposit     = (d.petCount ?? 0) * (d.petFeePerPet ?? 300);
  const moveInTotal    = targetRent + depositAmt + appFeeTotal + adminFee + petDeposit;

  // Savings timelines
  const timelines = [
    { months: 3, label: "3 months" },
    { months: 6, label: "6 months" },
    { months: 12, label: "12 months" },
  ];

  // Budget cut suggestions — top 3 discretionary expenses
  const suggestions = DISCRETIONARY_KEYS
    .map(({ key, label, cutPct }) => {
      const current = d[key] || 0;
      if (current <= 0) return null;
      const cut = Math.round(current * cutPct);
      const reduced = current - cut;
      return { label, current, reduced, savings: cut };
    })
    .filter(Boolean)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);

  const totalCutSavings = suggestions.reduce((s, x) => s + x.savings, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* 30% rule explainer */}
      <Card style={{ borderWidth: 1, borderColor: C.blue }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 20 }}>📏</Text>
          <Text style={{ fontSize: 13, fontWeight: "900", color: C.blue }}>The 30% rule</Text>
        </View>
        <Text style={{ fontSize: 12, color: C.gray700, lineHeight: 18, marginBottom: 8 }}>
          The 30% rule is a widely-used guideline that says you shouldn't spend more than 30% of your <Text style={{ fontWeight: "700" }}>gross monthly income</Text> on rent.
        </Text>
        <View style={{ backgroundColor: C.blueLight, borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: C.blue, fontWeight: "700", marginBottom: 4 }}>Your numbers</Text>
          <Text style={{ fontSize: 12, color: C.gray700 }}>Gross income: <Text style={{ fontWeight: "800", color: C.charcoal }}>{fmt(grossMo)}/mo</Text></Text>
          <Text style={{ fontSize: 12, color: C.gray700 }}>30% standard: <Text style={{ fontWeight: "800", color: C.blue }}>{fmt(standardTier)}/mo</Text></Text>
          {splitCount > 1 && (
            <Text style={{ fontSize: 12, color: C.gray700 }}>Your share (÷{splitCount}): <Text style={{ fontWeight: "800", color: C.blue }}>{fmt(standardShare)}/mo</Text></Text>
          )}
        </View>
        <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>
          This rule comes from the U.S. Department of Housing and Urban Development (HUD), which classifies households spending more than 30% on housing as "cost-burdened." Going above that leaves less room for savings, debt payments, and unexpected expenses.
        </Text>
      </Card>

      {/* Target rent */}
      <Card>
        <SecTitle>Set your target rent</SecTitle>
        <SliderRow
          label="Target rent"
          min={0}
          max={5000}
          step={50}
          value={targetRent}
          onChange={v => { setTargetRent(v); setData({ ...d, targetRent: v }); }}
          display={fmt(targetRent) + "/mo"}
          color={C.blue}
        />
        {splitCount > 1 && (
          <Text style={{ fontSize: 11, color: C.blue, marginTop: -8, marginBottom: 8 }}>Your share: {fmt(targetShare)}/mo (split {splitCount} ways)</Text>
        )}
      </Card>

      {/* Gap analysis */}
      {gap > 0 && (
        <Card style={{ borderWidth: 1.5, borderColor: C.amber }}>
          <SecTitle>Gap analysis</SecTitle>
          <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 6 }}>
            Your target is {fmt(gap)}/mo above the recommended standard tier ({fmt(standardShare)}/mo).
          </Text>
          <Alert type="warning">You'll need {fmt(gap)} more per month in income or budget cuts to afford this rent comfortably.</Alert>
        </Card>
      )}
      {gap <= 0 && (
        <Card style={{ borderWidth: 1.5, borderColor: C.green }}>
          <SecTitle>Gap analysis</SecTitle>
          <Alert type="success">Your target rent is at or below the recommended 30% standard tier. Great choice!</Alert>
        </Card>
      )}

      {/* Move-in cash needed */}
      <Card>
        <SecTitle>Move-in cash needed</SecTitle>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>First month's rent</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>{fmt(targetRent)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>{depositMonths === 0 ? "Security deposit (waived)" : `Security deposit (${depositMonths} mo)`}</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>{fmt(depositAmt)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>Application fee{splitCount > 1 ? ` (${splitCount} × ${fmt(appFeePerPerson)})` : ""}</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>{appFeePerPerson === 0 ? "Waived" : fmt(appFeeTotal)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>Admin fee (one-time)</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>{adminFee === 0 ? "Waived" : fmt(adminFee)}</Text>
        </View>
        {petDeposit > 0 && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: C.gray700 }}>Pet deposit ({d.petCount} pet{d.petCount > 1 ? "s" : ""})</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>{fmt(petDeposit)}</Text>
          </View>
        )}
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.gray100 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: C.charcoal }}>Total needed</Text>
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.blue }}>{fmt(moveInTotal)}</Text>
        </View>
      </Card>

      {/* Savings timelines */}
      <Card>
        <SecTitle>Savings timeline</SecTitle>
        <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>How much to save each month to reach {fmt(moveInTotal)}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {timelines.map((t, i) => {
            const perMonth = Math.ceil(moveInTotal / t.months);
            const feasible = perMonth <= takeHome * 0.5;
            return (
              <View key={i} style={{ flex: 1, backgroundColor: feasible ? C.blueLight : C.amberLight, borderRadius: 12, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "800", color: feasible ? C.blue : C.amber, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</Text>
                <Text style={{ fontSize: 18, fontWeight: "900", color: feasible ? C.blue : C.amber, marginVertical: 4 }}>{fmt(perMonth)}</Text>
                <Text style={{ fontSize: 9, color: C.gray500 }}>per month</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Budget cut suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <SecTitle>Budget cut suggestions</SecTitle>
          <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 10 }}>Your top discretionary expenses — potential savings</Text>
          {suggestions.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: i < suggestions.length - 1 ? 0.5 : 0, borderBottomColor: C.gray100 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>{s.label}</Text>
                <Text style={{ fontSize: 11, color: C.gray500 }}>Cut from {fmt(s.current)} to {fmt(s.reduced)}</Text>
              </View>
              <View style={{ backgroundColor: C.greenPale, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: C.green }}>+{fmt(s.savings)}/mo</Text>
              </View>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: C.gray100, marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "800", color: C.charcoal }}>Total potential savings</Text>
            <Text style={{ fontSize: 14, fontWeight: "900", color: C.green }}>{fmt(totalCutSavings)}/mo</Text>
          </View>
        </Card>
      )}

      <NavButtons onBack={onBack} onNext={onNext} accent={C.blue} />
    </ScrollView>
  );
}
