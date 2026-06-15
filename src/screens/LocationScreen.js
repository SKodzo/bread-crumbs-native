import { useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Linking,
} from "react-native";
import Slider from "@react-native-community/slider";
import { C } from "../lib/colors";
import { ZIP_DB, getCrime, getClimate } from "../lib/data";
import { Card, SecTitle, Alert, BtnPri } from "../components/UI";

const riskColor = r => r === "Extreme" || r === "Very High" ? C.red : r === "High" ? C.amber : r === "Moderate" || r === "Low-Moderate" ? C.greenMid : C.green;
const riskBg    = r => r === "Extreme" || r === "Very High" ? C.redLight : r === "High" ? C.amberLight : r === "Moderate" || r === "Low-Moderate" ? "#FFF7ED" : C.greenLight;

function CrimeCard({ crime, city, zip }) {
  if (!crime) return null;
  const sc = crime.safety;
  const safeColor = sc >= 8 ? C.green : sc >= 5 ? C.amber : C.red;
  const safeBg    = sc >= 8 ? C.greenLight : sc >= 5 ? C.amberLight : C.redLight;
  const primaryUrl   = crime.source ? crime.source.url : "https://www.fbi.gov/services/cjis/ucr";
  const primaryLabel = crime.source ? crime.source.name : "FBI Uniform Crime Reports";
  return (
    <View style={[cs.crimeCard, { backgroundColor: safeBg }]}>
      <Text style={[cs.crimeTitle, { color: safeColor }]}>🚨 {city} Safety</Text>
      <View style={cs.safetyBarBg}>
        <View style={[cs.safetyBarFill, { width: `${sc * 10}%`, backgroundColor: safeColor }]} />
      </View>
      <View style={cs.crimeLinks}>
        <TouchableOpacity
          onPress={() => Linking.openURL(primaryUrl)}
          style={[cs.crimeLink, { borderColor: safeColor }]}
        >
          <View style={cs.govBadge}><Text style={cs.govBadgeText}>.GOV</Text></View>
          <Text style={[cs.crimeLinkTitle, { color: safeColor }]}>Official {city} crime stats →</Text>
          <Text style={cs.crimeLinkSub}>{primaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.crimemapping.com/")}
          style={[cs.crimeLink, { borderColor: C.gray300 }]}
        >
          <Text style={[cs.crimeLinkTitle, { color: C.charcoal }]}>Search incidents near ZIP {zip} →</Text>
          <Text style={cs.crimeLinkSub}>CrimeMapping.com · official PD feeds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ZIP_TOOLS = (zip) => [
  { name: "FEMA Flood Map Service Center (.gov)", url: `https://msc.fema.gov/portal/search?AddressQuery=${zip}`, desc: `Enter ZIP ${zip} for the official FEMA flood zone designation for every parcel`, icon: "🌊", gov: true },
  { name: "FEMA National Risk Index (.gov)", url: "https://hazards.fema.gov/nri/", desc: "Multi-hazard risk scores — flood, hurricane, tornado, wildfire, heat wave & more by census tract", icon: "🗺️", gov: true },
  { name: "Wildfire Risk to Communities (.gov / USDA)", url: "https://wildfirerisk.org/", desc: `USDA Forest Service wildfire likelihood & exposure — search by ZIP ${zip}`, icon: "🔥", gov: true },
  { name: "First Street Foundation", url: "https://firststreet.org/", desc: `Flood, fire, wind & heat risk scores for specific properties — search ZIP ${zip}`, icon: "🌡️", gov: false },
  { name: "ClimateCheck", url: "https://climatecheck.com/", desc: `30-year climate risk projections (heat, drought, storm, fire, flood) — search ZIP ${zip}`, icon: "📊", gov: false },
];

function ClimateCard({ climate, state, zip }) {
  const tools = ZIP_TOOLS(zip);
  const activeRisks = climate ? Object.entries(climate).filter(([, v]) => v.risk !== "None") : [];
  return (
    <View>
      <View style={cs.climateToolsBox}>
        <Text style={cs.climateToolsTitle}>🌍 Get climate risk scores for ZIP {zip} specifically</Text>
        <Text style={cs.climateToolsDesc}>Climate risk varies block by block — flood zones, wildfire buffers, and heat islands don't follow city or state lines. Use these tools to look up your exact ZIP or address:</Text>
        {tools.map(t => (
          <TouchableOpacity key={t.name} onPress={() => Linking.openURL(t.url)} style={[cs.toolRow, t.gov && cs.toolRowGov]}>
            <Text style={cs.toolIcon}>{t.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {t.gov && <View style={cs.govBadge}><Text style={cs.govBadgeText}>.GOV</Text></View>}
                <Text style={cs.toolName}>{t.name} →</Text>
              </View>
              <Text style={cs.toolDesc}>{t.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={cs.climateWarning}>⚠️ Always check flood zone & get insurance quotes before making an offer — not after.</Text>
      </View>

      {activeRisks.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={cs.regionalLabel}>Regional context — {state} (state-level overview, your ZIP may differ):</Text>
          {activeRisks.map(([key, val]) => (
            <View key={key} style={[cs.riskRow, { backgroundColor: riskBg(val.risk) }]}>
              <Text style={[cs.riskLabel, { color: riskColor(val.risk) }]}>{val.icon} {key.charAt(0).toUpperCase() + key.slice(1)} Risk</Text>
              <Text style={[cs.riskValue, { color: riskColor(val.risk) }]}>{val.risk}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

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
              <View style={styles.rentLabelRow}>
                <Text style={styles.rentLabel}>Current monthly rent</Text>
                <Text style={styles.rentValue}>${(data.monthlyRent || 1500).toLocaleString()}/mo</Text>
              </View>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={300}
                maximumValue={5000}
                step={50}
                value={data.monthlyRent || 1500}
                onValueChange={v => setData({ ...data, monthlyRent: v })}
                minimumTrackTintColor={C.green}
                maximumTrackTintColor={C.gray300}
                thumbTintColor={C.green}
              />
              <Text style={styles.rentNote}>Used in the Wait vs. Buy analysis on your results page</Text>
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

              {crime && <CrimeCard crime={crime} city={locInfo.city} zip={locInfo.zip} />}
              {<ClimateCard climate={climate} state={locInfo.state} zip={locInfo.zip} />}
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
  rentLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rentLabel: { fontSize: 12, fontWeight: "700", color: C.charcoal },
  rentValue: { fontSize: 15, fontWeight: "800", color: C.green },
  rentNote: { fontSize: 11, color: C.gray500, marginTop: 2 },
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

const cs = StyleSheet.create({
  // Crime card
  crimeCard: { borderRadius: 12, padding: 12, marginBottom: 10 },
  crimeTitle: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  safetyBarBg: { height: 5, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.1)", overflow: "hidden", marginBottom: 10 },
  safetyBarFill: { height: "100%", borderRadius: 99 },
  crimeLinks: { flexDirection: "row", gap: 6 },
  crimeLink: { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1.5, borderRadius: 8, padding: 8, gap: 3 },
  crimeLinkTitle: { fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 14 },
  crimeLinkSub: { fontSize: 8, color: C.gray500, textAlign: "center", lineHeight: 12 },
  govBadge: { backgroundColor: C.blue, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  govBadgeText: { fontSize: 8, fontWeight: "900", color: C.white, letterSpacing: 0.5 },
  // Climate card
  climateToolsBox: { backgroundColor: C.blueLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  climateToolsTitle: { fontSize: 12, fontWeight: "800", color: C.blue, marginBottom: 4 },
  climateToolsDesc: { fontSize: 10, color: C.gray700, lineHeight: 15, marginBottom: 8 },
  toolRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 8, padding: 8, marginBottom: 5, borderWidth: 1, borderColor: "transparent" },
  toolRowGov: { backgroundColor: "rgba(219,234,254,0.7)", borderColor: "#93C5FD" },
  toolIcon: { fontSize: 16, marginTop: 1 },
  toolName: { fontSize: 11, fontWeight: "800", color: C.blue },
  toolDesc: { fontSize: 9, color: C.gray500, lineHeight: 13, marginTop: 2 },
  climateWarning: { fontSize: 9, color: C.gray500, marginTop: 6 },
  regionalLabel: { fontSize: 10, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  riskRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 5 },
  riskLabel: { fontSize: 13, fontWeight: "800" },
  riskValue: { fontSize: 12, fontWeight: "900" },
});
