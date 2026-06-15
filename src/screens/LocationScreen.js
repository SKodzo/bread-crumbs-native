import { useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { C } from "../lib/colors";
import { ZIP_DB, getCrime, getClimate } from "../lib/data";
import { Card, SecTitle, Alert, BtnPri } from "../components/UI";

export default function LocationScreen({ data, setData, onNext, programs = [] }) {
  const [zip, setZip] = useState(data.zip || "");
  const [status, setStatus] = useState(data.zip ? "found" : "idle");
  const [locInfo, setLocInfo] = useState(data.locationInfo || null);
  const [loading, setLoading] = useState(false);

  const lookup = async (z) => {
    const c = z.trim();
    if (c.length !== 5 || !/^\d{5}$/.test(c)) { setStatus("invalid"); return; }
    setLoading(true);
    if (ZIP_DB[c]) {
      const [st, ci, co] = ZIP_DB[c];
      setLocInfo({ zip: c, state: st, city: ci, county: co });
      setStatus("found");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${c}`);
      if (!res.ok) throw new Error();
      const j = await res.json();
      const pl = j.places[0];
      setLocInfo({ zip: c, state: pl["state abbreviation"], city: pl["place name"], county: "" });
      setStatus("found");
    } catch {
      setLocInfo({ zip: c, state: "", city: "", county: "" });
      setStatus("unknown");
    }
    setLoading(false);
  };

  const confirm = () => {
    setData({ ...data, zip, locationInfo: locInfo });
    onNext();
  };

  const layers = useMemo(() => {
    const m = { federal: 0, state: 0, city: 0, heroes: 0 };
    programs.forEach(p => { if (m[p.layer] !== undefined) m[p.layer]++; });
    return m;
  }, [programs]);

  const crime = locInfo ? getCrime(locInfo.city) : null;
  const climate = locInfo ? getClimate(locInfo.state) : null;

  const btnLabel = () => {
    if (status === "found") return data.isFirstTime ? "Let's find my first home →" : "Let's find my next home →";
    if (status === "unknown") return "Continue anyway →";
    return "Enter your zip code above";
  };

  const canContinue = status === "found" || status === "unknown";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* First home or buying again */}
        <Card>
          <SecTitle>Are you buying your first home or moving again?</SecTitle>
          <View style={styles.grid2}>
            {[
              { v: true,  emoji: "🏠", label: "First home",   sub: "I haven't owned before" },
              { v: false, emoji: "🔑", label: "Buying again", sub: "I've owned before" },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.v)}
                onPress={() => setData({ ...data, isFirstTime: opt.v })}
                style={[styles.optionCard, data.isFirstTime === opt.v && styles.optionCardSelected]}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, data.isFirstTime === opt.v && styles.optionLabelSelected]}>{opt.label}</Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {data.isFirstTime === false && (
            <Alert type="info">Some DPA programs are first-time buyer only. We'll still show you the programs you qualify for.</Alert>
          )}
        </Card>

        {/* Household size */}
        <Card>
          <SecTitle>Household size</SecTitle>
          <Text style={styles.helpText}>Number of people in your household, including yourself. Used to determine AMI eligibility for assistance programs.</Text>
          <View style={styles.sizeRow}>
            {[1,2,3,4,5,6,7,8].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setData({ ...data, householdSize: n })}
                style={[styles.sizeBtn, (data.householdSize || 1) === n && styles.sizeBtnSelected]}
                activeOpacity={0.7}
              >
                <Text style={[(data.householdSize || 1) === n ? styles.sizeBtnTextSelected : styles.sizeBtnText]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {(data.householdSize || 1) >= 4 && (
            <Alert type="info">Larger households often qualify for higher AMI thresholds — you may be eligible for more programs.</Alert>
          )}
        </Card>

        {/* Currently renting */}
        <Card>
          <SecTitle>Are you currently renting?</SecTitle>
          <Text style={styles.helpText}>Your current rent is used in the Wait vs. Buy analysis to show the true cost of waiting.</Text>
          <View style={styles.grid2}>
            {[
              { v: true,  emoji: "🏢", label: "Yes, I rent", sub: "Enter your monthly rent below" },
              { v: false, emoji: "🏠", label: "No / Other",  sub: "Living with family, own property, etc." },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.v)}
                onPress={() => setData({ ...data, isRenting: opt.v })}
                style={[styles.optionCard, data.isRenting === opt.v && styles.optionCardSelected]}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, data.isRenting === opt.v && styles.optionLabelSelected]}>{opt.label}</Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {data.isRenting && (
            <View style={styles.rentRow}>
              <Text style={styles.rentLabel}>Monthly rent</Text>
              <View style={styles.rentInputRow}>
                <Text style={styles.rentDollar}>$</Text>
                <TextInput
                  style={styles.rentInput}
                  keyboardType="number-pad"
                  value={String(data.monthlyRent || 1500)}
                  onChangeText={t => setData({ ...data, monthlyRent: parseInt(t.replace(/\D/g, "")) || 0 })}
                  maxLength={5}
                />
                <Text style={styles.rentPer}>/mo</Text>
              </View>
            </View>
          )}
        </Card>

        {/* ZIP code */}
        <Card>
          <SecTitle>Where are you buying?</SecTitle>
          <Text style={styles.helpText}>Enter your target zip code to unlock every assistance program, crime rating, climate risk, and neighborhood guide for your area.</Text>

          <TextInput
            style={[
              styles.zipInput,
              status === "found"   && styles.zipInputGreen,
              status === "invalid" && styles.zipInputRed,
            ]}
            value={zip}
            onChangeText={t => {
              setZip(t);
              if (t.length === 5) lookup(t);
            }}
            placeholder="e.g. 77004"
            placeholderTextColor={C.gray300}
            keyboardType="number-pad"
            maxLength={5}
            textAlign="center"
          />

          <TouchableOpacity
            onPress={() => lookup(zip)}
            style={styles.lookupBtn}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.lookupBtnText}>Look up</Text>
            }
          </TouchableOpacity>

          {status === "invalid" && <Alert type="danger">Please enter a valid 5-digit US zip code.</Alert>}
          {status === "unknown" && (
            <Alert type="warning">
              ZIP {zip} not in our database. Federal and state programs will still show. For city-specific programs, check your local housing authority.
            </Alert>
          )}

          {status === "found" && locInfo && (
            <View>
              <View style={styles.confirmedBox}>
                <Text style={styles.confirmedLabel}>Location confirmed ✓</Text>
                <Text style={styles.confirmedCity}>{locInfo.city}{locInfo.county ? `, ${locInfo.county} County` : ""}</Text>
                <Text style={styles.confirmedState}>{locInfo.state} · ZIP {locInfo.zip}</Text>
              </View>

              <Text style={styles.programsFound}>🎯 <Text style={{ fontWeight: "800" }}>{programs.length} programs found</Text> for your location:</Text>

              <View style={styles.badgeRow}>
                {Object.entries(layers).filter(([, v]) => v > 0).map(([k, v]) => (
                  <View key={k} style={styles.badge}>
                    <Text style={styles.badgeText}>{v} {k === "city" ? "City/County" : k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                  </View>
                ))}
              </View>

              {crime && (
                <View style={[styles.infoCard, { borderLeftColor: crime.color }]}>
                  <Text style={styles.infoCardTitle}>Safety · {locInfo.city}</Text>
                  <Text style={[styles.infoCardBadge, { color: crime.color }]}>{crime.label}</Text>
                  <Text style={styles.infoCardDetail}>{crime.detail}</Text>
                </View>
              )}

              {climate && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Climate risks · {locInfo.state}</Text>
                  {Object.entries(climate).map(([k, v]) => (
                    <Text key={k} style={styles.climateRow}>{v.icon} <Text style={{ fontWeight: "700" }}>{k.charAt(0).toUpperCase() + k.slice(1)}:</Text> {v.risk}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>

        <BtnPri onPress={confirm} disabled={!canContinue}>
          {btnLabel()}
        </BtnPri>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F5F5F0" },
  content: { padding: 16, paddingTop: 8 },
  helpText: { fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 },
  grid2: { flexDirection: "row", gap: 8 },
  optionCard: {
    flex: 1, borderWidth: 2, borderColor: C.gray300, borderRadius: 12,
    padding: 12, alignItems: "center", backgroundColor: C.white,
  },
  optionCardSelected: { borderColor: C.green, backgroundColor: C.greenLight },
  optionEmoji: { fontSize: 22, marginBottom: 4 },
  optionLabel: { fontSize: 13, fontWeight: "800", color: C.charcoal, textAlign: "center" },
  optionLabelSelected: { color: C.green },
  optionSub: { fontSize: 10, color: C.gray500, marginTop: 2, textAlign: "center" },
  sizeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sizeBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 2,
    borderColor: C.gray300, backgroundColor: C.white,
    alignItems: "center", justifyContent: "center",
  },
  sizeBtnSelected: { borderColor: C.green, backgroundColor: C.green },
  sizeBtnText: { fontSize: 14, fontWeight: "800", color: C.charcoal },
  sizeBtnTextSelected: { fontSize: 14, fontWeight: "800", color: C.white },
  rentRow: { marginTop: 12 },
  rentLabel: { fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 6 },
  rentInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: C.gray300, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  rentDollar: { fontSize: 18, fontWeight: "700", color: C.charcoal, marginRight: 4 },
  rentInput: { flex: 1, fontSize: 18, fontWeight: "700", color: C.charcoal },
  rentPer: { fontSize: 13, color: C.gray500 },
  zipInput: {
    fontSize: 22, fontWeight: "700", textAlign: "center", letterSpacing: 4,
    padding: 14, borderWidth: 2, borderColor: C.gray300, borderRadius: 12,
    color: C.charcoal, backgroundColor: C.white, marginBottom: 10,
  },
  zipInputGreen: { borderColor: C.green },
  zipInputRed: { borderColor: C.red },
  lookupBtn: {
    backgroundColor: C.green, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 8,
  },
  lookupBtnText: { color: C.white, fontSize: 15, fontWeight: "700" },
  confirmedBox: {
    backgroundColor: C.greenLight, borderRadius: 12,
    padding: 14, marginTop: 12, marginBottom: 12,
  },
  confirmedLabel: { fontSize: 11, color: C.greenMid, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  confirmedCity: { fontSize: 20, fontWeight: "900", color: C.green },
  confirmedState: { fontSize: 14, color: C.greenMid, fontWeight: "600" },
  programsFound: { fontSize: 13, color: C.charcoal, marginBottom: 8 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  badge: { backgroundColor: C.greenLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", color: C.green },
  infoCard: {
    borderLeftWidth: 3, borderLeftColor: C.gray300,
    backgroundColor: C.gray100, borderRadius: 10,
    padding: 12, marginBottom: 10,
  },
  infoCardTitle: { fontSize: 11, fontWeight: "700", color: C.gray700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoCardBadge: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  infoCardDetail: { fontSize: 12, color: C.gray700, lineHeight: 17 },
  climateRow: { fontSize: 12, color: C.charcoal, lineHeight: 20 },
});
