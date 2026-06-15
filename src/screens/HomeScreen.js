import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { C } from "../lib/colors";
import { fmt, fmtK } from "../lib/math";
import { Card, SecTitle } from "../components/UI";

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

function BigNum({ label, value, color, sub, bg }) {
  return (
    <View style={[s.bigNum, bg && { backgroundColor: bg }]}>
      <Text style={s.bigNumLabel}>{label}</Text>
      <Text style={[s.bigNumValue, { color }]}>{value}</Text>
      {sub ? <Text style={s.bigNumSub}>{sub}</Text> : null}
    </View>
  );
}

function PBar({ value, max, color }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={s.pbarBg}>
      <View style={[s.pbarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function HomeScreen({ data, setData, onNext, onBack }) {
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
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>

      {/* Target price */}
      <Card>
        <SecTitle>Target price</SecTitle>
        <SliderRow
          label="Purchase price"
          min={100000} max={900000} step={5000}
          value={d.price}
          onChange={v => setData({ ...d, price: v })}
          display={fmt(d.price)}
          note={`${m}× income — ${mLabel}`}
          color={mc}
        />
        <View style={s.bigNumRow}>
          <BigNum
            label="Down payment"
            value={fmt(d.price * (d.dpPct || 5) / 100)}
            color={C.green}
            bg={C.greenPale}
          />
          <BigNum
            label="Income multiple"
            value={m + "×"}
            color={mc}
            sub={m <= 3.5 ? "comfortable" : m <= 4.5 ? "manageable" : "stretch"}
            bg={m <= 3.5 ? C.greenPale : m <= 4.5 ? C.amberLight : C.redLight}
          />
          <BigNum
            label="Loan amount"
            value={fmtK(d.price * (1 - (d.dpPct || 5) / 100))}
            color={C.charcoal}
            bg={C.gray100}
          />
        </View>
      </Card>

      {/* Affordability ranges */}
      <Card>
        <SecTitle>Affordability ranges</SecTitle>
        {ranges.map(t => (
          <View key={t.l} style={s.rangeRow}>
            <View style={s.rangeHeader}>
              <Text style={s.rangeLabel}>{t.l}</Text>
              <Text style={s.rangeMax}>up to {fmt(t.max)}</Text>
            </View>
            <PBar value={Math.min(d.price, t.max)} max={t.max} color={d.price <= t.max ? t.col : C.red} />
            <Text style={s.rangeDesc}>{t.desc}</Text>
          </View>
        ))}
      </Card>

      {/* Nav */}
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
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  sliderLabel: { fontSize: 12, fontWeight: "700", color: C.charcoal, flex: 1 },
  sliderDisplay: { fontSize: 22, fontWeight: "900" },
  sliderNote: { fontSize: 11, color: C.gray500, marginTop: -4 },
  bigNumRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  bigNum: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center", backgroundColor: C.gray100 },
  bigNumLabel: { fontSize: 9, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4, textAlign: "center" },
  bigNumValue: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  bigNumSub: { fontSize: 9, color: C.gray500, marginTop: 2, textAlign: "center" },
  pbarBg: { height: 6, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginVertical: 4 },
  pbarFill: { height: "100%", borderRadius: 99 },
  rangeRow: { marginBottom: 14 },
  rangeHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  rangeLabel: { fontSize: 12, color: C.gray700 },
  rangeMax: { fontSize: 12, fontWeight: "700", color: C.charcoal },
  rangeDesc: { fontSize: 10, color: C.gray500, marginTop: 4, lineHeight: 15 },
  navRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 24 },
  backBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 },
  backBtnText: { fontSize: 15, fontWeight: "700", color: C.gray700 },
  nextBtn: { flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green },
  nextBtnText: { fontSize: 15, fontWeight: "800", color: C.white },
});
