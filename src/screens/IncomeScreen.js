import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { fmt, fmtK } from "../lib/math";
import { federalTax, FILING_LABELS } from "../lib/tax";
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
        <Text style={{ fontSize: 18, fontWeight: "900", color: trackColor }}>{display}</Text>
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

const PROFESSIONS = [
  { v: "teacher",        emoji: "🍎", label: "Teacher / Educator",    sub: "K-12, college, admin" },
  { v: "first_responder",emoji: "🚒", label: "Firefighter / EMT",      sub: "Fire, EMS, paramedic" },
  { v: "law_enforcement",emoji: "🚔", label: "Law Enforcement",        sub: "Police, sheriff, corrections" },
  { v: "healthcare",     emoji: "🏥", label: "Healthcare Worker",      sub: "Nurse, doctor, allied health" },
  { v: "government",     emoji: "🏛️", label: "Government Employee",    sub: "Federal, state, or local" },
  { v: "none",           emoji: "💼", label: "Other / None",           sub: "No profession preference" },
];

export default function IncomeScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const grossMo   = Math.round((d.income || 0) / 12);
  const alimonyMo = Math.round((d.alimony || 0) / 12);
  const status    = d.filingStatus || "single";
  const pretaxAmt = (d.k401 || 0) + (d.hsa || 0) + (d.ira || 0);
  const taxSav    = Math.round((federalTax({ gross: d.income || 0, status }) - federalTax({ gross: d.income || 0, pretax: pretaxAmt, status })) / 12);
  const scoreColor = (d.score || 700) >= 740 ? C.green : (d.score || 700) >= 700 ? C.greenMid : (d.score || 700) >= 640 ? C.amber : C.red;
  const scoreNote  = (d.score || 700) >= 740 ? "Excellent — best conventional rates"
                   : (d.score || 700) >= 700 ? "Good — conventional eligible"
                   : (d.score || 700) >= 640 ? "Fair — FHA recommended"
                   : "Below 640 — FHA or credit repair first";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Card>
        <SecTitle>Income</SecTitle>
        <SliderRow
          label="Annual gross income"
          min={0} max={700000} step={1000}
          value={d.income || 0}
          onChange={v => setData({ ...d, income: v })}
          display={fmtK(d.income || 0) + "/yr"}
          note={fmt(grossMo) + "/mo gross"}
        />
        <SliderRow
          label="Alimony received"
          min={0} max={100000} step={500}
          value={d.alimony || 0}
          onChange={v => setData({ ...d, alimony: v })}
          display={fmtK(d.alimony || 0) + "/yr"}
          note={alimonyMo > 0 ? fmt(alimonyMo) + "/mo · counts toward qualifying income" : "Optional — add if you receive alimony"}
        />
      </Card>

      <Card>
        <SecTitle>Filing status</SecTitle>
        <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>How you file your federal taxes — affects your tax brackets and standard deduction.</Text>
        <View style={{ gap: 8 }}>
          {[
            { k: "single", emoji: "👤", sub: "Not married" },
            { k: "mfj",    emoji: "👫", sub: "Married, filing together" },
            { k: "mfs",    emoji: "↔️",  sub: "Married, filing separately" },
            { k: "hoh",    emoji: "🏠", sub: "Single with dependents" },
          ].map(opt => (
            <TouchableOpacity
              key={opt.k}
              onPress={() => setData({ ...d, filingStatus: opt.k })}
              style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                borderWidth: 2, borderRadius: 10, padding: 10,
                borderColor: status === opt.k ? C.green : C.gray300,
                backgroundColor: status === opt.k ? C.greenLight : C.card,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: status === opt.k ? C.green : C.charcoal }}>{FILING_LABELS[opt.k]}</Text>
                <Text style={{ fontSize: 10, color: C.gray500 }}>{opt.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <SecTitle>Retirement contributions</SecTitle>
        <SliderRow
          label="401(k) / 403(b) per year"
          min={0} max={23500} step={500}
          value={d.k401 || 0}
          onChange={v => setData({ ...d, k401: v })}
          display={fmtK(d.k401 || 0) + "/yr"}
          note={`Pre-tax · ${Math.round((d.k401 || 0) / 23500 * 100)}% of $23,500 limit`}
          color={C.amber}
        />
        <SliderRow
          label="Roth IRA per year"
          min={0} max={7000} step={250}
          value={d.roth || 0}
          onChange={v => setData({ ...d, roth: v })}
          display={fmtK(d.roth || 0) + "/yr"}
          note={`Post-tax · ${Math.round((d.roth || 0) / 7000 * 100)}% of $7,000 limit`}
          color={C.amber}
        />
        <SliderRow
          label="Traditional IRA per year"
          min={0} max={7000} step={250}
          value={d.ira || 0}
          onChange={v => setData({ ...d, ira: v })}
          display={fmtK(d.ira || 0) + "/yr"}
          note={`Pre-tax · ${Math.round((d.ira || 0) / 7000 * 100)}% of $7,000 limit`}
          color={C.amber}
        />
        <SliderRow
          label="HSA per year"
          min={0} max={4300} step={100}
          value={d.hsa || 0}
          onChange={v => setData({ ...d, hsa: v })}
          display={fmtK(d.hsa || 0) + "/yr"}
          note={`Pre-tax · ${Math.round((d.hsa || 0) / 4300 * 100)}% of $4,300 limit`}
          color={C.amber}
        />
        {taxSav > 0 && (
          <Alert type="info">Pre-tax contributions save you {fmt(taxSav)}/mo in federal taxes.</Alert>
        )}
      </Card>

      <Card>
        <SecTitle>Liquid savings</SecTitle>
        <SliderRow
          label="Current savings & cash on hand"
          min={0} max={200000} step={5000}
          value={d.savings || 0}
          onChange={v => setData({ ...d, savings: v })}
          display={fmtK(d.savings || 0)}
          note={d.isFirstTime === false ? "Checking, savings, and cash on hand — in addition to your home equity" : "Checking, savings, and money market accounts — used for down payment, closing costs, and asset limit checks on assistance programs"}
          color={C.green}
        />
        {d.isFirstTime === false && (
          <SliderRow
            label="Current monthly mortgage payment"
            min={0} max={5000} step={50}
            value={d.currentMortgagePayment || 0}
            onChange={v => setData({ ...d, currentMortgagePayment: v })}
            display={"$" + (d.currentMortgagePayment || 0).toLocaleString() + "/mo"}
            note="This goes away when you sell — won't count against your new DTI"
            color={C.green}
          />
        )}
      </Card>

      <Card>
        <SecTitle>Investment &amp; retirement balances</SecTitle>
        <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 14, lineHeight: 18 }}>
          Enter what you currently own in these accounts today.
        </Text>
        <SliderRow
          label="Personal investment accounts (brokerage, stocks, crypto)"
          min={0} max={500000} step={5000}
          value={d.investAcct || 0}
          onChange={v => setData({ ...d, investAcct: v })}
          display={fmtK(d.investAcct || 0)}
          note="Taxable brokerage — not immediately earmarked for down payment"
          color={C.amber}
        />
        <SliderRow
          label="Roth IRA / Traditional IRA balance"
          min={0} max={200000} step={5000}
          value={d.rothBalance || 0}
          onChange={v => setData({ ...d, rothBalance: v })}
          display={fmtK(d.rothBalance || 0)}
          note="Current account balance, not annual contributions"
          color={C.amber}
        />
        <SliderRow
          label="401(k) / 403(b) balance"
          min={0} max={1000000} step={10000}
          value={d.retirementBalance || 0}
          onChange={v => setData({ ...d, retirementBalance: v })}
          display={fmtK(d.retirementBalance || 0)}
          note="Current account balance, not annual contributions"
          color={C.amber}
        />
      </Card>

      <Card>
        <SecTitle>Your profession</SecTitle>
        <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>
          Many lenders and programs offer special benefits for certain professions. Select yours to unlock every program you qualify for.
        </Text>
        <View style={{ gap: 8 }}>
          {PROFESSIONS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              onPress={() => setData({ ...d, profession: opt.v })}
              style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                borderWidth: 2,
                borderColor: d.profession === opt.v ? C.green : C.gray300,
                borderRadius: 10, padding: 10,
                backgroundColor: d.profession === opt.v ? C.greenLight : C.card,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", lineHeight: 16, color: d.profession === opt.v ? C.green : C.charcoal }}>{opt.label}</Text>
                <Text style={{ fontSize: 10, color: C.gray500 }}>{opt.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {d.profession && d.profession !== "none" && (
          <Alert type="info">Great — we'll show profession-specific programs on the next steps.</Alert>
        )}
      </Card>

      <Card>
        <SecTitle>Credit profile</SecTitle>
        <SliderRow
          label="Credit score"
          min={0} max={850} step={10}
          value={d.score || 700}
          onChange={v => setData({ ...d, score: v })}
          display={String(d.score || 700)}
          note={scoreNote}
          color={scoreColor}
        />
        <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 17, marginTop: 4 }}>
          Lenders evaluate your application using the middle score from the 3 major bureaus.{" "}
          <Text style={{ color: C.blue, fontWeight: "600" }} onPress={() => Linking.openURL("https://www.annualcreditreport.com")}>
            Check your free report at annualcreditreport.com
          </Text>
          .
        </Text>
      </Card>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 24 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Continue →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["FHA", "FICO", "AMI", "MCC", "DPA"]} />

    </ScrollView>
  );
}
