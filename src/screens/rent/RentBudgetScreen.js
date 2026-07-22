import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { federalTax, ficaTax } from "../../lib/tax";
import { stateTax } from "../../lib/stateTax";
import { getUtilities } from "../../lib/data";
import { SliderRow, Card, SecTitle, Alert, NavButtons } from "../../components/UI";

export default function RentBudgetScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "";
  const status = d.filingStatus || "single";
  const grossMo = Math.round((d.income || 0) / 12);
  const fedTaxYr = federalTax({ gross: d.income || 0, status });
  const ficaYr = ficaTax(d.income || 0, status);
  const stateTaxYr = stateTax(st, d.income || 0);
  const taxMo = Math.round((fedTaxYr + ficaYr + stateTaxYr) / 12);
  const takeHome = grossMo - taxMo;

  const personal = (d.groc || 0) + (d.dining || 0) + (d.ent || 0) + (d.pcare || 0) + (d.car || 0) + (d.childcare || 0) + (d.healthcare || 0) + (d.education || 0) + (d.misc || 0);
  const debtTotal = (d.debts || 0) + (d.student || 0);
  const utilTotal = d.rentalType === "house" ? getUtilities(st) : Math.round(getUtilities(st) * 0.7);
  const splitCount = (d.roommates || 0) + 1;
  const sharedUtil = Math.round(utilTotal / splitCount);
  const insuranceFull = d.rentalType === "house" ? 35 : 20;
  const sharedInsurance = Math.round(insuranceFull / splitCount);
  const totalShared = sharedUtil + sharedInsurance;
  const totalExpenses = personal + debtTotal + (d.efund || 0) + totalShared;
  const remaining = takeHome - totalExpenses;

  const fullMonthlyExpenses = personal + debtTotal + totalShared;
  const target3mo = fullMonthlyExpenses * 3;
  const target6mo = fullMonthlyExpenses * 6;
  const monthsTo3 = (d.monthlySavingsContribution || 0) > 0 ? Math.max(0, Math.ceil((target3mo - (d.currentSavings || 0)) / d.monthlySavingsContribution)) : 999;
  const monthsTo6 = (d.monthlySavingsContribution || 0) > 0 ? Math.max(0, Math.ceil((target6mo - (d.currentSavings || 0)) / d.monthlySavingsContribution)) : 999;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Personal expenses */}
      <Card>
        <SecTitle>Your personal expenses</SecTitle>
        <SliderRow label="Groceries" min={0} max={1000} step={25} value={d.groc || 0} onChange={v => setData({ ...d, groc: v })} display={fmt(d.groc || 0)} color={C.blue} />
        <SliderRow label="Dining out" min={0} max={500} step={25} value={d.dining || 0} onChange={v => setData({ ...d, dining: v })} display={fmt(d.dining || 0)} color={C.blue} />
        <SliderRow label="Entertainment" min={0} max={500} step={25} value={d.ent || 0} onChange={v => setData({ ...d, ent: v })} display={fmt(d.ent || 0)} color={C.blue} />
        <SliderRow label="Personal care" min={0} max={500} step={25} value={d.pcare || 0} onChange={v => setData({ ...d, pcare: v })} display={fmt(d.pcare || 0)} color={C.blue} />
        <SliderRow label="Car / transport" min={0} max={1000} step={25} value={d.car || 0} onChange={v => setData({ ...d, car: v })} display={fmt(d.car || 0)} color={C.blue} />
        <SliderRow label="Childcare" min={0} max={3000} step={50} value={d.childcare || 0} onChange={v => setData({ ...d, childcare: v })} display={fmt(d.childcare || 0)} color={C.blue} />
        <SliderRow label="Healthcare" min={0} max={1000} step={25} value={d.healthcare || 0} onChange={v => setData({ ...d, healthcare: v })} display={fmt(d.healthcare || 0)} color={C.blue} />
        <SliderRow label="Education" min={0} max={1000} step={25} value={d.education || 0} onChange={v => setData({ ...d, education: v })} display={fmt(d.education || 0)} color={C.blue} />
        <SliderRow label="Misc" min={0} max={500} step={25} value={d.misc || 0} onChange={v => setData({ ...d, misc: v })} display={fmt(d.misc || 0)} color={C.blue} />
      </Card>

      {/* Debts */}
      <Card>
        <SecTitle>Debts</SecTitle>
        <SliderRow label="Student loans" min={0} max={2000} step={25} value={d.student || 0} onChange={v => setData({ ...d, student: v })} display={fmt(d.student || 0)} color={C.red} />
        <SliderRow label="Other debts" min={0} max={2000} step={25} value={d.debts || 0} onChange={v => setData({ ...d, debts: v })} display={fmt(d.debts || 0)} color={C.red} />
      </Card>

      {/* Shared costs */}
      {d.roommates > 0 && (
        <Card style={{ borderWidth: 1.5, borderColor: C.blue }}>
          <SecTitle>Shared costs (split {splitCount} ways)</SecTitle>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: C.charcoal }}>Utilities (total)</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.blue }}>{fmt(utilTotal)}</Text>
          </View>
          <Text style={{ fontSize: 11, color: C.blue, marginBottom: 10 }}>Your share: {fmt(sharedUtil)}/mo</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: C.charcoal }}>Renter's insurance (total)</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.blue }}>{fmt(insuranceFull)}</Text>
          </View>
          <Text style={{ fontSize: 11, color: C.blue }}>Your share: {fmt(sharedInsurance)}/mo</Text>
        </Card>
      )}

      {d.roommates === 0 && (
        <Card>
          <SecTitle>Housing costs</SecTitle>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: C.charcoal }}>Est. utilities ({st || "avg"})</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.blue }}>{fmt(utilTotal)}/mo</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: C.charcoal }}>Renter's insurance</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.blue }}>{fmt(insuranceFull)}/mo</Text>
          </View>
        </Card>
      )}

      {/* Emergency fund */}
      <Card style={{ borderWidth: 1.5, borderColor: C.amber }}>
        <SecTitle>Emergency fund</SecTitle>
        <SliderRow label="Current savings" min={0} max={50000} step={500} value={d.currentSavings || 0} onChange={v => setData({ ...d, currentSavings: v })} display={fmtK(d.currentSavings || 0)} color={C.amber} />
        <SliderRow label="Monthly contribution" min={0} max={1000} step={25} value={d.monthlySavingsContribution || 0} onChange={v => setData({ ...d, monthlySavingsContribution: v })} display={fmt(d.monthlySavingsContribution || 0) + "/mo"} color={C.amber} />

        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gray500, marginBottom: 6 }}>Total monthly expenses: {fmt(fullMonthlyExpenses)}</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View style={{ flex: 1, backgroundColor: (d.currentSavings || 0) >= target3mo ? C.greenPale : C.redLight, borderRadius: 10, padding: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 9, fontWeight: "700", color: (d.currentSavings || 0) >= target3mo ? C.green : C.red }}>3-MONTH</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: (d.currentSavings || 0) >= target3mo ? C.green : C.red }}>{fmtK(target3mo)}</Text>
            <Text style={{ fontSize: 9, color: C.gray500 }}>{(d.currentSavings || 0) >= target3mo ? "✓ Reached" : `~${monthsTo3} mo to go`}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: (d.currentSavings || 0) >= target6mo ? C.greenPale : C.amberLight, borderRadius: 10, padding: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 9, fontWeight: "700", color: (d.currentSavings || 0) >= target6mo ? C.green : C.amber }}>6-MONTH</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: (d.currentSavings || 0) >= target6mo ? C.green : C.amber }}>{fmtK(target6mo)}</Text>
            <Text style={{ fontSize: 9, color: C.gray500 }}>{(d.currentSavings || 0) >= target6mo ? "✓ Reached" : `~${monthsTo6} mo to go`}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 10, color: C.gray500, marginTop: 6, lineHeight: 15 }}>Based on all your monthly expenses — a full picture of what you need in reserve if income stops.</Text>
      </Card>

      {/* Running total */}
      <View style={{ backgroundColor: C.greenPale, borderWidth: 1.5, borderColor: C.green, borderRadius: 12, padding: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: C.green }}>Your total monthly costs</Text>
            <Text style={{ fontSize: 10, color: C.greenMid }}>Personal {fmt(personal)} + debts {fmt(debtTotal)} + shared {fmt(totalShared)} + savings {fmt(d.efund || 0)}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.green }}>{fmt(totalExpenses)}</Text>
        </View>
        <Text style={{ fontSize: 11, color: C.greenMid, marginTop: 4 }}>Take-home {fmt(takeHome)} — {fmt(remaining)} remaining for rent</Text>
      </View>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="See my results →" accent={C.blue} />
    </ScrollView>
  );
}
