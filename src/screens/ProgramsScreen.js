import { useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useTheme } from "../lib/theme";
import { fmt, calcSaleProceeds } from "../lib/math";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

// Major urban metros that are NOT USDA-eligible (population 50K+)
const URBAN_CITIES = new Set(["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Oklahoma City","Nashville","El Paso","Washington","Las Vegas","Louisville","Memphis","Portland","Baltimore","Milwaukee","Albuquerque","Tucson","Fresno","Sacramento","Mesa","Kansas City","Atlanta","Omaha","Colorado Springs","Raleigh","Long Beach","Virginia Beach","Minneapolis","Tampa","New Orleans","Arlington","Wichita","Cleveland","Bakersfield","Aurora","Anaheim","Santa Ana","Corpus Christi","Riverside","Lexington","St. Louis","Pittsburgh","Anchorage","Stockton","Cincinnati","St. Paul","Greensboro","Toledo","Newark","Plano","Henderson","Orlando","Lincoln","Jersey City","Chandler","St. Petersburg","Laredo","Norfolk","Madison","Durham","Lubbock","Winston-Salem","Garland","Glendale","Hialeah","Reno","Baton Rouge","Irvine","Chesapeake","Irving","Scottsdale","North Las Vegas","Fremont","Gilbert","San Bernardino","Birmingham","Rochester","Richmond","Spokane","Des Moines","Montgomery","Modesto","Fayetteville","Tacoma","Shreveport","Fontana","Moreno Valley","Akron","Yonkers","Glendale","Columbus","Aurora","Oxnard","Columbus","Fort Wayne","Providence","Knoxville","Tempe","Chattanooga","Oceanside","Garden Grove","Rancho Cucamonga","Cape Coral","Santa Clarita","Fort Lauderdale","Elk Grove","Ontario","Peoria","Salem","Cary","Eugene","Hayward","Clarksville","Salinas","Lancaster","Corona","Palmdale","Sunnyvale","Pomona","Escondido","Kansas City","Savannah","Surprise","Pasadena","Hollywood","Torrance","Mesquite","Paterson","Macon","Alexandria","Lakewood","Dayton","Orange","Fullerton","Killeen","McKinney","Frisco","McAllen","Joliet","Bridgeport","Bellevue","Syracuse","Warren","Denton","Cedar Rapids","Roseville","Hampton","Visalia","Pasadena","Columbia","Sterling Heights","Gainesville","Carrollton","Hartford","Coral Springs","Midland","Concord","Olathe","Thousand Oaks","Round Rock","Topeka","Simi Valley","Waco","Sioux Falls","Springfield","Rockford","Torrance","Vancouver","Hartford","Pembroke Pines","West Valley City","Inglewood","Arvada","Ann Arbor","Peoria","Independence","Provo","Flint","Worcester","Lansing","Athens","Berkeley","El Monte","Abilene","Colorado Springs","Santa Rosa"]);

const isUsdaIneligible = (city) => city && URBAN_CITIES.has(city);

const LAYERS = [
  { id: "federal", label: "Federal",                        col: "#1D4ED8", bg: "#DBEAFE" },
  { id: "state",   label: "State",                          col: "#1B6B44", bg: "#E8F5EE" },
  { id: "city",    label: "City / County",                  col: "#065F46", bg: "#D1FAE5" },
  { id: "heroes",  label: "Heroes, Professions & Nonprofits", col: "#4C1D95", bg: "#EDE9FE" },
];

export default function ProgramsScreen({ data, setData, onNext, onBack, programs: allP = [], hud = {} }) {
  const C = useTheme();
  const d = data;
  const loc = d.locationInfo || {};
  // Use live HUD AMI if available; fallback to raw income comparison
  const areaAMI = hud.ami || null;
  const usdaBlocked = isUsdaIneligible(loc.city);

  const progMap = useMemo(() => new Map(allP.map(p => [p.id, p])), [allP]);
  const incompat = useMemo(() => {
    const s = new Set();
    ( d.programs || []).forEach(id => { const p = progMap.get(id); if (p) p.incompat.forEach(i => s.add(i)); });
    return s;
  }, [d.programs, progMap]);

  const toggle = useCallback(id => {
    const prog = progMap.get(id); if (!prog) return;
    if ((d.programs || []).includes(id)) { setData({ ...d, programs: (d.programs || []).filter(p => p !== id) }); return; }
    const cleared = (d.programs || []).filter(p => !prog.incompat.includes(p));
    setData({ ...d, programs: [...cleared, id] });
  }, [d, setData, progMap]);

  const totalAssist = useMemo(() =>
    (d.programs || []).reduce((s, id) => { const p = progMap.get(id); return p ? s + p.calc(d.price) : s; }, 0),
    [d.programs, d.price, progMap]);

  const dp = d.price * d.dpPct / 100;
  const fhaUp = d.loanType === "fha" ? (d.price - dp) * 0.0175 : 0;
  const needed = dp + d.price * 0.03 + 1000 + fhaUp;
  const saleProceeds = d.isFirstTime === false ? calcSaleProceeds(d.currentHomeValue || 0, d.currentMortgageBalance || 0) : 0;
  const oop = Math.max(0, needed - totalAssist - saleProceeds);
  const totalAssets = (d.savings || 0) + (d.investAcct || 0) + (d.rothBalance || 0) + (d.retirementBalance || 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {loc.city && (
        <View style={{ backgroundColor: C.greenLight, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: C.green, fontWeight: "600" }}>📍 Showing programs for {loc.city}, {loc.state} (ZIP {loc.zip})</Text>
          <Text style={{ fontSize: 11, color: C.gray500, marginTop: 6, lineHeight: 16 }}>
            Additional local programs may be available. Check{" "}
            <Text style={{ color: C.blue, fontWeight: "600" }} onPress={() => Linking.openURL("https://downpaymentresource.com/are-you-eligible/")}>downpaymentresource.com</Text>
            {" "}and your city/county housing authority for a complete list.
          </Text>
        </View>
      )}

      {/* HUD AMI context banner */}
      {areaAMI ? (
        <View style={{ backgroundColor: C.blueLight || "#DBEAFE", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.blue || "#1D4ED8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            {hud.county ? `${hud.county} County` : loc.state} Area Median Income · HUD {hud.hudYear || new Date().getFullYear()}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "80% AMI", value: hud.ami80, note: "Low-income threshold" },
              { label: "100% AMI", value: areaAMI, note: "Area median" },
              { label: "120% AMI", value: hud.ami120, note: "Moderate-income cap" },
            ].map(item => (
              <View key={item.label} style={{
                flex: 1, borderRadius: 8, padding: 8, alignItems: "center",
                backgroundColor: d.income <= item.value ? C.greenPale : C.card,
                borderWidth: 1, borderColor: d.income <= item.value ? C.green : C.border,
              }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: C.blue, marginBottom: 2 }}>{item.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: "900", color: d.income <= item.value ? C.green : C.text }}>${Math.round(item.value / 1000)}K</Text>
                <Text style={{ fontSize: 8, color: C.gray500, marginTop: 1, textAlign: "center" }}>{item.note}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 10, color: C.gray700, marginTop: 8 }}>
            Your income: <Text style={{ fontWeight: "800" }}>${Math.round(d.income / 1000)}K</Text>
            {" "}·{" "}
            <Text style={{ fontWeight: "800", color: d.income <= areaAMI ? C.green : C.amber }}>
              {Math.round(d.income / areaAMI * 100)}% of area median
            </Text>
          </Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 13, color: C.gray700, marginBottom: 12, lineHeight: 20 }}>
        Programs are grouped by funding layer. Select any you may qualify for — incompatible programs grey out automatically.
      </Text>

      {LAYERS.map(layer => {
        const lp = allP.filter(p => p.layer === layer.id);
        if (!lp.length) return null;
        return (
          <View key={layer.id} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={{ backgroundColor: layer.bg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: layer.col, letterSpacing: 0.4 }}>{layer.label}</Text>
              </View>
              <View style={{ flex: 1, height: 1, backgroundColor: C.gray100 }} />
            </View>
            <View style={{ gap: 8 }}>
              {lp.map(prog => {
                const on = (d.programs || []).includes(prog.id);
                const dim = !on && incompat.has(prog.id);
                // If HUD gave us real county AMI, compute actual pct; otherwise fall back to raw income vs amiLimit
                const effectiveAMI = areaAMI
                  ? (prog.amiPct ? areaAMI * prog.amiPct : prog.amiLimit)
                  : prog.amiLimit;
                const amiOver = effectiveAMI && d.income > effectiveAMI;
                const assetOver = prog.assetCap && totalAssets > prog.assetCap;
                const wrongLoan = prog.fhaOnly && d.loanType !== "fha";
                const ftoBlock = prog.fto && d.isFirstTime === false;
                const usdaBlock = prog.id === "usda" && usdaBlocked;
                const isDisqualified = dim || amiOver || assetOver || wrongLoan || ftoBlock || usdaBlock;
                const disqualLabel = usdaBlock ? `${loc.city} is not in a USDA-eligible rural area`
                  : ftoBlock ? "First-time buyers only"
                  : wrongLoan ? "FHA loans only — switch to FHA to use this program"
                  : dim ? "Incompatible with a selected program"
                  : assetOver ? `Assets (${fmt(totalAssets)}) may exceed the ${fmt(prog.assetCap)} cap`
                  : amiOver ? `Income (${fmt(d.income)}) may exceed ${effectiveAMI ? fmt(effectiveAMI) + " " : ""}AMI limit`
                  : null;
                return (
                  <TouchableOpacity
                    key={prog.id}
                    onPress={(isDisqualified && !on) ? undefined : () => toggle(prog.id)}
                    style={{
                      borderWidth: on ? 2 : 1.5,
                      borderColor: on ? C.green : C.gray300,
                      borderRadius: 12, padding: 12,
                      backgroundColor: on ? C.greenLight : C.card,
                      opacity: (isDisqualified && !on) ? 0.35 : 1,
                    }}
                    activeOpacity={(isDisqualified && !on) ? 1 : 0.7}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: C.charcoal, flex: 1, paddingRight: 8 }}>{prog.name}</Text>
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? C.green : C.gray100, alignItems: "center", justifyContent: "center" }}>
                        {on && <Text style={{ color: C.white, fontSize: 11, fontWeight: "900" }}>✓</Text>}
                      </View>
                    </View>
                    <Text style={{ fontSize: 10, color: C.gray500, marginTop: 4, lineHeight: 14 }}>{prog.short}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: on ? C.green : C.charcoal, marginTop: 6 }}>
                      {prog.calc(d.price) > 0 ? fmt(prog.calc(d.price)) : prog.amount}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.gray500, marginTop: 4, lineHeight: 14 }}>{prog.note}</Text>
                    {disqualLabel && <Text style={{ fontSize: 9, fontWeight: "700", color: C.red, marginTop: 4 }}>⚠ {disqualLabel}</Text>}
                    {prog.expires && <Text style={{ fontSize: 9, fontWeight: "700", color: C.amber, marginTop: 4 }}>⏰ {prog.expires}</Text>}
                    {prog.url && (
                      <TouchableOpacity onPress={() => Linking.openURL(prog.url)}>
                        <Text style={{ fontSize: 10, color: C.blue, marginTop: 6 }}>Learn more →</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Stacked total */}
      <Card>
        <SecTitle>Your stacked total</SecTitle>
        <View style={{ gap: 8 }}>
          {[
            { l: "Total assistance",        v: totalAssist > 0 ? fmt(totalAssist) : "$0 — select programs above", vc: totalAssist > 0 ? C.green : C.gray500 },
            { l: "Cash needed (DP + closing)", v: fmt(needed), vc: C.charcoal },
          ].map(r => (
            <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>{r.l}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: r.vc }}>{r.v}</Text>
            </View>
          ))}
          {totalAssist > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>Assistance covers</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>- {fmt(Math.min(totalAssist, needed))}</Text>
            </View>
          )}
          {saleProceeds > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>Home sale proceeds</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>- {fmt(Math.min(saleProceeds, Math.max(0, needed - totalAssist)))}</Text>
            </View>
          )}
          {totalAssist > needed && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>Surplus → principal reduction</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>- {fmt(totalAssist - needed)}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 2, borderTopColor: C.gray100, marginTop: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal }}>You bring to closing</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: oop === 0 ? C.green : oop < 10000 ? C.amber : C.red }}>{fmt(oop)}</Text>
          </View>
        </View>
        {oop === 0 && totalAssist > 0 && <Alert type="info">🎉 $0 out of pocket at closing with this combination!</Alert>}
      </Card>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Continue →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["DPA", "MCC", "FHA", "VA", "HUD", "AMI", "NACA", "GNND"]} />

    </ScrollView>
  );
}
