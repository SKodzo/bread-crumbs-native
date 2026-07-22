import { useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { calcSaleProceeds, fmt } from "../lib/math";
import { ZIP_DB, getCrime, getClimate } from "../lib/data";
import { Card, SecTitle, Alert, BtnPri } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function riskColor(r, C) {
  return r === "Extreme" || r === "Very High" ? C.red : r === "High" ? C.amber : r === "Moderate" || r === "Low-Moderate" ? C.greenMid : C.green;
}
function riskBg(r, C) {
  return r === "Extreme" || r === "Very High" ? C.redLight : r === "High" ? C.amberLight : r === "Moderate" || r === "Low-Moderate" ? C.amberLight : C.greenLight;
}

const ZIP_TOOLS = (zip) => [
  { name: "FEMA Flood Map Service Center (.gov)", url: `https://msc.fema.gov/portal/search?AddressQuery=${zip}`, desc: `Enter ZIP ${zip} for the official FEMA flood zone designation for every parcel`, icon: "🌊", gov: true },
  { name: "FEMA National Risk Index (.gov)", url: "https://hazards.fema.gov/nri/", desc: "Multi-hazard risk scores — flood, hurricane, tornado, wildfire, heat wave & more by census tract", icon: "🗺️", gov: true },
  { name: "Wildfire Risk to Communities (.gov / USDA)", url: "https://wildfirerisk.org/", desc: `USDA Forest Service wildfire likelihood & exposure — search by ZIP ${zip}`, icon: "🔥", gov: true },
  { name: "First Street Foundation", url: "https://firststreet.org/", desc: `Flood, fire, wind & heat risk scores for specific properties — search ZIP ${zip}`, icon: "🌡️", gov: false },
  { name: "ClimateCheck", url: "https://climatecheck.com/", desc: `30-year climate risk projections (heat, drought, storm, fire, flood) — search ZIP ${zip}`, icon: "📊", gov: false },
];

function CrimeCard({ crime, city, zip }) {
  const C = useTheme();
  if (!crime) return null;
  const sc = crime.safety;
  const safeColor = sc >= 8 ? C.green : sc >= 5 ? C.amber : C.red;
  const safeBg    = sc >= 8 ? C.greenLight : sc >= 5 ? C.amberLight : C.redLight;
  const primaryUrl   = crime.source ? crime.source.url : "https://www.fbi.gov/services/cjis/ucr";
  const primaryLabel = crime.source ? crime.source.name : "FBI Uniform Crime Reports";
  return (
    <View style={{ borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: safeBg }}>
      <Text style={{ fontSize: 13, fontWeight: "800", marginBottom: 8, color: safeColor }}>🚨 {city} Safety</Text>
      <View style={{ height: 5, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.1)", overflow: "hidden", marginBottom: 10 }}>
        <View style={{ height: "100%", borderRadius: 99, width: `${sc * 10}%`, backgroundColor: safeColor }} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TouchableOpacity
          onPress={() => Linking.openURL(primaryUrl)}
          style={{ flex: 1, alignItems: "center", backgroundColor: C.card, borderWidth: 1.5, borderRadius: 8, padding: 8, gap: 3, borderColor: safeColor }}
        >
          <View style={{ backgroundColor: C.blue, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: "900", color: C.white, letterSpacing: 0.5 }}>.GOV</Text>
          </View>
          <Text style={{ fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 14, color: safeColor }}>Official {city} crime stats →</Text>
          <Text style={{ fontSize: 8, color: C.gray500, textAlign: "center", lineHeight: 12 }}>{primaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.crimemapping.com/")}
          style={{ flex: 1, alignItems: "center", backgroundColor: C.card, borderWidth: 1.5, borderRadius: 8, padding: 8, gap: 3, borderColor: C.gray300 }}
        >
          <Text style={{ fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 14, color: C.text }}>Search incidents near ZIP {zip} →</Text>
          <Text style={{ fontSize: 8, color: C.gray500, textAlign: "center", lineHeight: 12 }}>CrimeMapping.com · official PD feeds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ClimateCard({ climate, state, zip }) {
  const C = useTheme();
  const tools = ZIP_TOOLS(zip);
  const activeRisks = climate ? Object.entries(climate).filter(([, v]) => v.risk !== "None") : [];
  return (
    <View>
      <View style={{ backgroundColor: C.blueLight, borderRadius: 12, padding: 12, marginBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: C.blue, marginBottom: 4 }}>🌍 Get climate risk scores for ZIP {zip} specifically</Text>
        <Text style={{ fontSize: 10, color: C.gray700, lineHeight: 15, marginBottom: 8 }}>Climate risk varies block by block — flood zones, wildfire buffers, and heat islands don't follow city or state lines. Use these tools to look up your exact ZIP or address:</Text>
        {tools.map(t => (
          <TouchableOpacity
            key={t.name}
            onPress={() => Linking.openURL(t.url)}
            style={{
              flexDirection: "row", alignItems: "flex-start", gap: 8,
              backgroundColor: t.gov ? "rgba(219,234,254,0.7)" : "rgba(255,255,255,0.75)",
              borderRadius: 8, padding: 8, marginBottom: 5,
              borderWidth: 1, borderColor: t.gov ? "#93C5FD" : "transparent",
            }}
          >
            <Text style={{ fontSize: 16, marginTop: 1 }}>{t.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {t.gov && (
                  <View style={{ backgroundColor: C.blue, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 8, fontWeight: "900", color: C.white, letterSpacing: 0.5 }}>.GOV</Text>
                  </View>
                )}
                <Text style={{ fontSize: 11, fontWeight: "800", color: C.blue }}>{t.name} →</Text>
              </View>
              <Text style={{ fontSize: 9, color: C.gray500, lineHeight: 13, marginTop: 2 }}>{t.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={{ fontSize: 9, color: C.gray500, marginTop: 6 }}>⚠️ Always check flood zone & get insurance quotes before making an offer — not after.</Text>
      </View>

      {activeRisks.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Regional context — {state} (state-level overview, your ZIP may differ):</Text>
          {activeRisks.map(([key, val]) => (
            <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 5, backgroundColor: riskBg(val.risk, C) }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: riskColor(val.risk, C) }}>{val.icon} {key.charAt(0).toUpperCase() + key.slice(1)} Risk</Text>
              <Text style={{ fontSize: 12, fontWeight: "900", color: riskColor(val.risk, C) }}>{val.risk}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function LocationScreen({ data, setData, onNext, programs = [] }) {
  const C = useTheme();
  const [zip, setZip] = useState(data.zip || "");
  const [status, setStatus] = useState(data.zip ? "found" : "idle");
  const [locInfo, setLocInfo] = useState(data.locationInfo || null);
  const [loading, setLoading] = useState(false);
  const [homeValKey] = useState(() => `hv_${data.currentHomeValue || 0}`);
  const [mortKey] = useState(() => `mb_${data.currentMortgageBalance || 0}`);
  const [rentKey] = useState(() => `rent_${data.monthlyRent || 1500}`);

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
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8 }} keyboardShouldPersistTaps="handled">

        {/* First home or buying again */}
        <Card>
          <SecTitle>Are you buying your first home or moving again?</SecTitle>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { v: true,  emoji: "🏠", label: "First home",   sub: "I haven't owned before" },
              { v: false, emoji: "🔑", label: "Buying again", sub: "I've owned before" },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.v)}
                onPress={() => setData({ ...data, isFirstTime: opt.v })}
                style={{
                  flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: "center",
                  borderColor: data.isFirstTime === opt.v ? C.green : C.gray300,
                  backgroundColor: data.isFirstTime === opt.v ? C.greenLight : C.card,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: "800", textAlign: "center", color: data.isFirstTime === opt.v ? C.green : C.charcoal }}>{opt.label}</Text>
                <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2, textAlign: "center" }}>{opt.sub}</Text>
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
          <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>Number of people in your household, including yourself. Used to determine AMI eligibility for assistance programs.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[1,2,3,4,5,6,7,8].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setData({ ...data, householdSize: n })}
                style={{
                  width: 40, height: 40, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center",
                  borderColor: (data.householdSize || 1) === n ? C.green : C.gray300,
                  backgroundColor: (data.householdSize || 1) === n ? C.green : C.card,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: (data.householdSize || 1) === n ? C.white : C.charcoal }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {(data.householdSize || 1) >= 4 && (
            <Alert type="info">Larger households often qualify for higher AMI thresholds — you may be eligible for more programs.</Alert>
          )}
        </Card>

        {/* Repeat buyer: current home equity inputs */}
        {data.isFirstTime === false && (
          <Card>
            <SecTitle>Your current home</SecTitle>
            <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>We'll use this to calculate your sale proceeds and buying power for your next home.</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Estimated home value</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: C.green }}>{fmt(data.currentHomeValue || 0)}</Text>
            </View>
            <Slider key={homeValKey} style={{ width: "100%", height: 40 }} minimumValue={50000} maximumValue={2000000} step={5000} value={data.currentHomeValue || 0} onValueChange={v => setData({ ...data, currentHomeValue: v })} minimumTrackTintColor={C.green} maximumTrackTintColor={C.gray300} thumbTintColor={C.green} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Remaining mortgage balance</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: C.green }}>{fmt(data.currentMortgageBalance || 0)}</Text>
            </View>
            <Slider key={mortKey} style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={2000000} step={5000} value={data.currentMortgageBalance || 0} onValueChange={v => setData({ ...data, currentMortgageBalance: v })} minimumTrackTintColor={C.green} maximumTrackTintColor={C.gray300} thumbTintColor={C.green} />

            {(data.currentHomeValue || 0) > 0 && (
              <View style={{ marginTop: 16, backgroundColor: C.greenPale, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.green }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: C.gray700 }}>Estimated equity</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>{fmt(Math.max(0, (data.currentHomeValue || 0) - (data.currentMortgageBalance || 0)))}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: C.gray700 }}>Agent fees + closing (~8%)</Text>
                  <Text style={{ fontSize: 12, color: C.gray500 }}>−{fmt((data.currentHomeValue || 0) * 0.08)}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: C.border, marginVertical: 6 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: C.green }}>Net sale proceeds</Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: C.green }}>{fmt(calcSaleProceeds(data.currentHomeValue || 0, data.currentMortgageBalance || 0))}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* First-time buyer: currently renting */}
        {data.isFirstTime !== false && (
          <Card>
            <SecTitle>Are you currently renting?</SecTitle>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { v: true,  emoji: "🏢", label: "Yes, I rent", sub: "Enter your monthly rent below" },
                { v: false, emoji: "🏠", label: "No / Other",  sub: "Living with family, etc." },
              ].map(opt => (
                <TouchableOpacity
                  key={String(opt.v)}
                  onPress={() => setData({ ...data, isRenting: opt.v })}
                  style={{
                    flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: "center",
                    borderColor: data.isRenting === opt.v ? C.green : C.gray300,
                    backgroundColor: data.isRenting === opt.v ? C.greenLight : C.card,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", textAlign: "center", color: data.isRenting === opt.v ? C.green : C.charcoal }}>{opt.label}</Text>
                  <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2, textAlign: "center" }}>{opt.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {data.isRenting && (
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Current monthly rent</Text>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: C.green }}>${(data.monthlyRent || 1500).toLocaleString()}/mo</Text>
                </View>
                <Slider key={rentKey} style={{ width: "100%", height: 40 }} minimumValue={300} maximumValue={5000} step={50} value={data.monthlyRent || 1500} onValueChange={v => setData({ ...data, monthlyRent: v })} minimumTrackTintColor={C.green} maximumTrackTintColor={C.gray300} thumbTintColor={C.green} />
                <Text style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>Used in the Wait vs. Buy analysis on your results page</Text>
              </View>
            )}
          </Card>
        )}

        {/* ZIP code */}
        <Card>
          <SecTitle>Where are you buying?</SecTitle>
          <Text style={{ fontSize: 12, color: C.gray700, marginBottom: 12, lineHeight: 18 }}>Enter your target zip code to unlock every assistance program, crime rating, climate risk, and neighborhood guide for your area.</Text>

          <TextInput
            style={{
              fontSize: 22, fontWeight: "700", textAlign: "center", letterSpacing: 4,
              padding: 14, borderWidth: 2, borderRadius: 12, marginBottom: 10,
              color: C.charcoal, backgroundColor: C.card,
              borderColor: status === "found" ? C.green : status === "invalid" ? C.red : C.gray300,
            }}
            value={zip}
            onChangeText={t => {
              setZip(t);
              if (t.length === 5) lookup(t);
            }}
            placeholder="e.g. 77004"
            placeholderTextColor={C.gray500}
            keyboardType="number-pad"
            maxLength={5}
            textAlign="center"
          />

          <TouchableOpacity
            onPress={() => lookup(zip)}
            style={{ backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 8 }}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>Look up</Text>
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
              <View style={{ backgroundColor: C.greenLight, borderRadius: 12, padding: 14, marginTop: 12, marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: C.greenMid, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Location confirmed ✓</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: C.green }}>{locInfo.city}{locInfo.county ? `, ${locInfo.county} County` : ""}</Text>
                <Text style={{ fontSize: 14, color: C.greenMid, fontWeight: "600" }}>{locInfo.state} · ZIP {locInfo.zip}</Text>
              </View>

              <Text style={{ fontSize: 13, color: C.charcoal, marginBottom: 8 }}>🎯 <Text style={{ fontWeight: "800" }}>{programs.length} programs found</Text> for your location:</Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {Object.entries(layers).filter(([, v]) => v > 0).map(([k, v]) => (
                  <View key={k} style={{ backgroundColor: C.greenLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.green }}>{v} {k === "city" ? "City/County" : k.charAt(0).toUpperCase() + k.slice(1)}</Text>
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

        <GlossaryBar keys={["DPA", "AMI", "FEMA", "USDA", "UCR", "NRI"]} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
