import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, InteractionManager } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { FILING_LABELS } from "../../lib/tax";
import { ZIP_DB } from "../../lib/data";
import ZCTA_NAMES from "../../lib/zctaNames";
import { useCrime } from "../../lib/useCrime";
import { SliderRow, Card, SecTitle, Alert, NavButtons } from "../../components/UI";

export default function RentProfileScreen({ data, setData, onNext }) {
  const C = useTheme();
  const d = data;
  const grossMo = Math.round((d.income || 0) / 12);
  const loc = d.locationInfo || {};
  const status = d.filingStatus || "single";
  const { crime, loading: crimeLoading } = useCrime(loc.city ? loc : null);
  const crimeColor = crime?.safety === "low" ? C.green : crime?.safety === "medium" ? C.amber : crime ? C.red : null;

  const onZipChange = (zip) => {
    InteractionManager.runAfterInteractions(() => {
      const entry = ZIP_DB[zip];
      if (entry) {
        const rawCity = entry[1];
        const city = (rawCity.startsWith("Zcta") || rawCity.startsWith("ZCTA") || /^\d/.test(rawCity))
          ? (ZCTA_NAMES[zip] || entry[2] + " County")
          : rawCity;
        setData({ ...d, zip, locationInfo: { state: entry[0], city, county: entry[2], zip } });
      } else {
        setData({ ...d, zip, locationInfo: null });
      }
    });
  };

  const scoreColor = (d.score || 700) >= 720 ? C.green : (d.score || 700) >= 640 ? C.amber : C.red;
  const scoreNote = (d.score || 700) >= 720 ? "Most landlords approve. Deposit may be waived."
    : (d.score || 700) >= 640 ? "Most landlords approve. Standard deposit."
    : "May need a co-signer or larger deposit.";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* Apartment or house */}
        <Card>
          <SecTitle>What are you looking for?</SecTitle>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[{ v: "apartment", icon: "🏢", label: "Apartment" }, { v: "house", icon: "🏠", label: "House" }].map(opt => (
              <TouchableOpacity
                key={opt.v}
                onPress={() => setData({ ...d, rentalType: opt.v })}
                style={{ flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: "center", borderColor: d.rentalType === opt.v ? C.blue : C.gray300, backgroundColor: d.rentalType === opt.v ? C.blueLight : C.card }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: d.rentalType === opt.v ? C.blue : C.charcoal }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {d.rentalType === "house" && (
            <Alert type="info">Houses typically have higher utilities, yard maintenance, and possibly larger security deposits.</Alert>
          )}
        </Card>

        {/* Roommates */}
        <Card>
          <SecTitle>Roommates</SecTitle>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
            {[{ v: 0, label: "Just me" }, { v: -1, label: "With roommates" }].map(opt => {
              const active = opt.v === 0 ? d.roommates === 0 : d.roommates > 0;
              return (
                <TouchableOpacity
                  key={opt.v}
                  onPress={() => setData({ ...d, roommates: opt.v === 0 ? 0 : Math.max(d.roommates, 1) })}
                  style={{ flex: 1, borderWidth: 2, borderRadius: 8, padding: 8, alignItems: "center", borderColor: active ? C.blue : C.gray300, backgroundColor: active ? C.blueLight : C.card }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: active ? C.blue : C.charcoal }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {d.roommates > 0 && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>How many roommates?</Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: C.blue }}>{d.roommates}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[1, 2, 3, 4].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setData({ ...d, roommates: n })}
                    style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center", borderColor: d.roommates === n ? C.blue : C.gray300, backgroundColor: d.roommates === n ? C.blueLight : C.card }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: d.roommates === n ? C.blue : C.charcoal }}>{n === 4 ? "4+" : n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Alert type="info">Rent and shared costs split evenly. Your personal expenses stay yours.</Alert>
            </>
          )}
        </Card>

        {/* Income */}
        <Card>
          <SecTitle>Your income</SecTitle>
          <SliderRow
            label="Annual gross income"
            min={0} max={300000} step={1000}
            value={d.income || 0}
            onChange={v => setData({ ...d, income: v })}
            display={fmtK(d.income || 0) + "/yr"}
            note={fmt(grossMo) + "/mo gross"}
            color={C.blue}
          />
        </Card>

        {/* Filing status */}
        <Card>
          <SecTitle>Filing status</SecTitle>
          <View style={{ gap: 6 }}>
            {[
              { k: "single", emoji: "👤", label: "Single", sub: "Not married" },
              { k: "mfj", emoji: "👫", label: "Married jointly", sub: "Filing together" },
              { k: "mfs", emoji: "↔️", label: "Married sep.", sub: "Filing separately" },
              { k: "hoh", emoji: "🏠", label: "Head of household", sub: "With dependents" },
            ].map(opt => (
              <TouchableOpacity
                key={opt.k}
                onPress={() => setData({ ...d, filingStatus: opt.k })}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderRadius: 10, padding: 10, borderColor: status === opt.k ? C.blue : C.gray300, backgroundColor: status === opt.k ? C.blueLight : C.card }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: status === opt.k ? C.blue : C.charcoal }}>{opt.label}</Text>
                  <Text style={{ fontSize: 10, color: C.gray500 }}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Credit score */}
        <Card>
          <SecTitle>Credit score</SecTitle>
          <SliderRow
            label="Your score"
            min={0} max={850} step={10}
            value={d.score || 700}
            onChange={v => setData({ ...d, score: v })}
            display={String(d.score || 700)}
            note={scoreNote}
            color={scoreColor}
          />
        </Card>

        {/* ZIP + rent averages */}
        <Card>
          <SecTitle>Where are you looking?</SecTitle>
          <TextInput
            value={d.zip}
            onChangeText={onZipChange}
            placeholder="e.g. 77004"
            placeholderTextColor={C.gray500}
            keyboardType="number-pad"
            maxLength={5}
            style={{ borderWidth: 1.5, borderColor: loc.city ? C.blue : C.gray300, borderRadius: 10, padding: 12, fontSize: 16, fontWeight: "700", color: C.text, backgroundColor: loc.city ? C.blueLight : C.card, textAlign: "center" }}
          />
          {loc.city ? (
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.blue, textAlign: "center", marginTop: 6 }}>
              {loc.city}, {loc.state} (ZIP {loc.zip})
            </Text>
          ) : d.zip?.length === 5 ? (
            <Text style={{ fontSize: 11, color: C.red, textAlign: "center", marginTop: 6 }}>ZIP not recognized. Try another.</Text>
          ) : null}
          <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>Required — used for state tax and local rent estimates</Text>
        </Card>

        {/* Crime / safety card — mirrors buying flow */}
        {(crimeLoading || crime) && (
          <Card>
            <SecTitle>Area Safety</SecTitle>
            {crimeLoading ? (
              <ActivityIndicator size="small" color={C.blue} />
            ) : crime ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: crimeColor }} />
                  <Text style={{ fontSize: 13, fontWeight: "800", color: crimeColor }}>
                    {crime.safety === "low" ? "Low crime area" : crime.safety === "medium" ? "Moderate crime area" : "Higher crime area"}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>Crime data is aggregate and historical. Visit the area and check local sources before signing a lease.</Text>
              </>
            ) : null}
          </Card>
        )}

        <NavButtons onNext={loc.city ? onNext : null} nextLabel="Continue →" accent={C.blue} />
        {!loc.city && (
          <Text style={{ fontSize: 11, color: C.red, textAlign: "center", marginBottom: 16 }}>Enter a valid ZIP code to continue</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
