import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { fmt } from "../lib/math";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function SliderRow({ label, min, max, step, value, onChange, note, color }) {
  const C = useTheme();
  const trackColor = color || C.green;
  const [mountKey] = useState(() => `${min}_${max}_${value}`);
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 18, fontWeight: "900", color: trackColor }}>{fmt(value)}/mo</Text>
      </View>
      <Slider
        key={mountKey}
        style={{ width: "100%", height: 36 }}
        minimumValue={min} maximumValue={max} step={step}
        value={value} onValueChange={onChange}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={C.gray300}
        thumbTintColor={trackColor}
      />
      {note ? <Text style={{ fontSize: 11, color: C.gray500, marginTop: -4 }}>{note}</Text> : null}
    </View>
  );
}

export default function BudgetScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const otherMo = (d.groc || 0) + (d.dining || 0) + (d.ent || 0) + (d.pcare || 0) + (d.car || 0) + (d.debts || 0) + (d.childcare || 0) + (d.healthcare || 0) + (d.education || 0) + (d.misc || 0);
  const annualSavings = (d.efund || 0) * 12;
  const runway = otherMo > 0 ? (annualSavings / otherMo).toFixed(1) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Text style={{ fontSize: 13, color: C.gray700, marginBottom: 12, lineHeight: 20 }}>
        Your complete monthly picture — not just the mortgage payment.
      </Text>

      {d.isFirstTime === false && (d.currentMortgagePayment || 0) > 0 && (
        <Alert type="info">Your current mortgage of {fmt(d.currentMortgagePayment)}/mo isn't included below — it goes away when you sell.</Alert>
      )}

      <Card>
        <SecTitle>Daily life</SecTitle>
        <SliderRow label="Groceries"                    min={0} max={2000} step={25} value={d.groc  || 0} onChange={v => setData({ ...d, groc:  v })} />
        <SliderRow label="Dining out"                   min={0} max={2000} step={25} value={d.dining|| 0} onChange={v => setData({ ...d, dining:v })} />
        <SliderRow label="Entertainment"                min={0} max={2000} step={25} value={d.ent   || 0} onChange={v => setData({ ...d, ent:   v })} />
        <SliderRow label="Personal care (hair, gym...)" min={0} max={2000} step={25} value={d.pcare || 0} onChange={v => setData({ ...d, pcare: v })} />
        <SliderRow label="Child care (day care, babysitting)" min={0} max={2000} step={50} value={d.childcare || 0} onChange={v => setData({ ...d, childcare: v })} />
        <SliderRow label="Health care (premiums, prescriptions)" min={0} max={2000} step={25} value={d.healthcare || 0} onChange={v => setData({ ...d, healthcare: v })} />
        <SliderRow label="Education (tuition, school fees)" min={0} max={2000} step={50} value={d.education || 0} onChange={v => setData({ ...d, education: v })} />
        <SliderRow label="Miscellaneous" min={0} max={2000} step={50} value={d.misc || 0} onChange={v => setData({ ...d, misc: v })} />
      </Card>

      <Card>
        <SecTitle>Transportation & savings</SecTitle>
        <SliderRow
          label="Car (payment + insurance + gas)"
          min={0} max={2000} step={50}
          value={d.car || 0}
          onChange={v => setData({ ...d, car: v })}
        />
        <SliderRow
          label="Emergency fund contributions"
          min={0} max={1000} step={50}
          value={d.efund || 0}
          onChange={v => setData({ ...d, efund: v })}
          note="Target 3–6 months of expenses before closing"
          color={C.green}
        />
        {(d.efund || 0) > 0 && (() => {
          const essentialsMo = (d.groc || 0) + (d.car || 0) + (d.healthcare || 0);
          const target3mo = essentialsMo * 3;
          const target6mo = essentialsMo * 6;
          const currentSav = d.currentSavings || 0;
          const monthly = d.efund || 0;
          const moTo3 = monthly > 0 ? Math.max(0, Math.ceil((target3mo - currentSav) / monthly)) : null;
          const moTo6 = monthly > 0 ? Math.max(0, Math.ceil((target6mo - currentSav) / monthly)) : null;
          return (
            <View style={{ backgroundColor: C.gray100, borderRadius: 8, padding: 10, marginTop: 4, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: C.gray700 }}>Annual savings at this rate</Text>
                <Text style={{ fontSize: 11, fontWeight: "800", color: C.green }}>{fmt(annualSavings)}/yr</Text>
              </View>
              {runway && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11, color: C.gray700 }}>Runway vs. other monthly expenses</Text>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: C.charcoal }}>{runway} months</Text>
                </View>
              )}
              {essentialsMo > 0 && (
                <>
                  <View style={{ height: 1, backgroundColor: C.gray300, marginVertical: 2 }} />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5 }}>Emergency fund milestones</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={{ flex: 1, backgroundColor: currentSav >= target3mo ? C.greenPale : C.card, borderWidth: 1, borderColor: currentSav >= target3mo ? C.green : C.gray300, borderRadius: 8, padding: 8, alignItems: "center" }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: currentSav >= target3mo ? C.green : C.gray500 }}>3-MONTH</Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: currentSav >= target3mo ? C.green : C.charcoal }}>{fmt(target3mo)}</Text>
                      <Text style={{ fontSize: 9, color: C.gray500 }}>{currentSav >= target3mo ? "✓ Reached" : moTo3 != null ? `~${moTo3} mo` : "Set a rate"}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: currentSav >= target6mo ? C.greenPale : C.card, borderWidth: 1, borderColor: currentSav >= target6mo ? C.green : C.gray300, borderRadius: 8, padding: 8, alignItems: "center" }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: currentSav >= target6mo ? C.green : C.gray500 }}>6-MONTH</Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: currentSav >= target6mo ? C.green : C.charcoal }}>{fmt(target6mo)}</Text>
                      <Text style={{ fontSize: 9, color: C.gray500 }}>{currentSav >= target6mo ? "✓ Reached" : moTo6 != null ? `~${moTo6} mo` : "Set a rate"}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })()}
      </Card>

      <Card>
        <SecTitle>Existing monthly debts</SecTitle>
        <SliderRow
          label="Monthly student loan payments"
          min={0} max={2000} step={25}
          value={d.student || 0}
          onChange={v => setData({ ...d, student: v })}
          note="Counts toward your back-end DTI"
        />
        <SliderRow
          label="Other debts (car loans, credit cards)"
          min={0} max={2000} step={50}
          value={d.debts || 0}
          onChange={v => setData({ ...d, debts: v })}
          note="Excluding future housing payment"
        />
        {(d.debts || 0) > 500 && (
          <Alert type="warning">High debt load ({fmt(d.debts)}/mo) will affect your DTI ratio. Consider paying down debts before buying.</Alert>
        )}
      </Card>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Continue →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["DTI", "PITI", "HOA"]} />

    </ScrollView>
  );
}
