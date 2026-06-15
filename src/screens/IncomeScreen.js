import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from "react-native";
import Slider from "@react-native-community/slider";
import { C } from "../lib/colors";
import { calcTax, fmt, fmtK } from "../lib/math";
import { Card, SecTitle, Alert, BtnPri } from "../components/UI";

function SliderRow({ label, min, max, step, value, onChange, display, note, color }) {
  const trackColor = color || C.green;
  return (
    <View style={s.sliderRow}>
      <View style={s.sliderHeader}>
        <Text style={s.sliderLabel}>{label}</Text>
        <Text style={[s.sliderDisplay, { color: trackColor }]}>{display}</Text>
      </View>
      <Slider
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
      {note ? <Text style={s.sliderNote}>{note}</Text> : null}
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
  const d = data;
  const grossMo   = Math.round((d.income || 0) / 12);
  const alimonyMo = Math.round((d.alimony || 0) / 12);
  const taxSav    = calcTax(d.income || 0, 0) - calcTax(d.income || 0, (d.k401 || 0) + (d.hsa || 0));
  const scoreColor = (d.score || 700) >= 740 ? C.green : (d.score || 700) >= 700 ? C.greenMid : (d.score || 700) >= 640 ? C.amber : C.red;
  const scoreNote  = (d.score || 700) >= 740 ? "Excellent — best conventional rates"
                   : (d.score || 700) >= 700 ? "Good — conventional eligible"
                   : (d.score || 700) >= 640 ? "Fair — FHA recommended"
                   : "Below 640 — FHA or credit repair first";

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>

      {/* Income */}
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

      {/* Retirement */}
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

      {/* Profession */}
      <Card>
        <SecTitle>Your profession</SecTitle>
        <Text style={s.helpText}>Many lenders and programs offer special benefits for certain professions. Select yours to unlock every program you qualify for.</Text>
        <View style={s.profGrid}>
          {PROFESSIONS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              onPress={() => setData({ ...d, profession: opt.v })}
              style={[s.profCard, d.profession === opt.v && s.profCardSelected]}
              activeOpacity={0.7}
            >
              <Text style={s.profEmoji}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.profLabel, d.profession === opt.v && s.profLabelSelected]}>{opt.label}</Text>
                <Text style={s.profSub}>{opt.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {d.profession && d.profession !== "none" && (
          <Alert type="info">Great — we'll show profession-specific programs on the next steps.</Alert>
        )}
      </Card>

      {/* Credit score */}
      <Card>
        <SecTitle>Credit profile</SecTitle>
        <SliderRow
          label="Credit score"
          min={500} max={850} step={10}
          value={d.score || 700}
          onChange={v => setData({ ...d, score: v })}
          display={String(d.score || 700)}
          note={scoreNote}
          color={scoreColor}
        />
        <Text style={s.creditNote}>
          Lenders evaluate your application using the middle score from the 3 major bureaus.{" "}
          <Text style={s.creditLink} onPress={() => Linking.openURL("https://www.annualcreditreport.com")}>
            Check your free report at annualcreditreport.com
          </Text>
          .
        </Text>
      </Card>

      {/* Nav buttons */}
      <View style={s.navRow}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.8}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={s.nextBtn} activeOpacity={0.8}>
          <Text style={s.nextBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F5F5F0" },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  helpText: { fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  sliderLabel: { fontSize: 12, fontWeight: "700", color: C.charcoal, flex: 1 },
  sliderDisplay: { fontSize: 18, fontWeight: "900" },
  sliderNote: { fontSize: 11, color: C.gray500, marginTop: -4 },
  profGrid: { gap: 8 },
  profCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: C.gray300, borderRadius: 10,
    padding: 10, backgroundColor: C.white,
  },
  profCardSelected: { borderColor: C.green, backgroundColor: C.greenLight },
  profEmoji: { fontSize: 20 },
  profLabel: { fontSize: 12, fontWeight: "800", color: C.charcoal, lineHeight: 16 },
  profLabelSelected: { color: C.green },
  profSub: { fontSize: 10, color: C.gray500 },
  creditNote: { fontSize: 11, color: C.gray500, lineHeight: 17, marginTop: 4 },
  creditLink: { color: C.blue, fontWeight: "600" },
  navRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 24 },
  backBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 },
  backBtnText: { fontSize: 15, fontWeight: "700", color: C.gray700 },
  nextBtn: { flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green },
  nextBtnText: { fontSize: 15, fontWeight: "800", color: C.white },
});
