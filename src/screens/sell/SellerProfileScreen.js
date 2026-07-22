import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { FILING_LABELS } from "../../lib/tax";
import { ZIP_DB } from "../../lib/data";
import { SliderRow, Card, SecTitle, Alert, NavButtons } from "../../components/UI";

const MEDIAN_BY_STATE = {
  CA: 750000, NY: 420000, TX: 310000, FL: 390000, IL: 260000, PA: 270000,
  OH: 210000, GA: 330000, NC: 320000, MI: 220000, NJ: 430000, VA: 370000,
  WA: 580000, AZ: 380000, MA: 520000, TN: 320000, IN: 230000, MO: 240000,
  MD: 380000, WI: 260000, CO: 530000, MN: 340000, SC: 290000, AL: 220000,
  LA: 210000, KY: 200000, OR: 450000, OK: 200000, CT: 370000, UT: 470000,
  NV: 400000, AR: 190000, MS: 170000, KS: 220000, NM: 280000, NE: 240000,
  ID: 420000, WV: 140000, HI: 830000, NH: 420000, ME: 310000, MT: 390000,
  RI: 390000, DE: 330000, SD: 270000, ND: 260000, AK: 330000, VT: 310000,
  WY: 310000, DC: 640000, IA: 210000,
};

const EXCLUSION = { single: 250000, mfj: 500000, mfs: 250000, hoh: 250000 };

export default function SellerProfileScreen({ data, setData, onNext }) {
  const C = useTheme();
  const d = data;
  const loc = d.locationInfo || {};
  const equity = Math.max(0, (d.homeValue || 0) - (d.mortgageBalance || 0));
  const status = d.filingStatus || "single";
  const yearsOwned = d.yearsOwned || 0;
  const propType = d.propertyType || "primary";

  const onZipChange = (zip) => {
    const entry = ZIP_DB[zip];
    if (entry) {
      setData({ ...d, zip, locationInfo: { state: entry[0], city: entry[1], county: entry[2], zip } });
    } else {
      setData({ ...d, zip, locationInfo: null });
    }
  };

  const medianPrice = loc.state ? (MEDIAN_BY_STATE[loc.state] || 350000) : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* ZIP */}
        <Card>
          <SecTitle>Where is your home?</SecTitle>
          <TextInput
            value={d.zip}
            onChangeText={onZipChange}
            placeholder="ZIP code"
            placeholderTextColor={C.gray400}
            keyboardType="number-pad"
            maxLength={5}
            style={{ borderWidth: 2, borderColor: loc.state ? C.amber : C.gray300, borderRadius: 10, padding: 12, fontSize: 16, fontWeight: "700", color: C.text, backgroundColor: C.card }}
          />
          {loc.state && (
            <View style={{ marginTop: 8, padding: 10, backgroundColor: C.amberLight, borderRadius: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.amber }}>{loc.city}, {loc.state} {loc.county ? `(${loc.county} County)` : ""}</Text>
              {medianPrice && (
                <Text style={{ fontSize: 12, color: C.gray500, marginTop: 4 }}>Median home price: {fmt(medianPrice)}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Home value */}
        <Card>
          <SecTitle>Home value</SecTitle>
          <SliderRow
            label="Estimated value"
            value={d.homeValue}
            min={0} max={2000000} step={5000}
            display={fmt(d.homeValue)}
            color={C.amber}
            onChange={v => setData({ ...d, homeValue: v })}
          />
        </Card>

        {/* Mortgage balance */}
        <Card>
          <SecTitle>Mortgage balance</SecTitle>
          <SliderRow
            label="Remaining balance"
            value={d.mortgageBalance}
            min={0} max={2000000} step={5000}
            display={fmt(d.mortgageBalance)}
            color={C.amber}
            onChange={v => setData({ ...d, mortgageBalance: v })}
          />
        </Card>

        {/* Equity preview */}
        <Card>
          <View style={{ padding: 14, backgroundColor: C.amberLight, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.amber, textTransform: "uppercase", letterSpacing: 0.5 }}>Your equity</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: C.amber, marginTop: 4 }}>{fmt(equity)}</Text>
            <Text style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>{fmt(d.homeValue)} value – {fmt(d.mortgageBalance)} owed</Text>
          </View>
        </Card>

        {/* Income */}
        <Card>
          <SecTitle>Household income</SecTitle>
          <SliderRow
            label="Gross annual income"
            value={d.income}
            min={0} max={500000} step={1000}
            display={fmtK(d.income) + "/yr"}
            color={C.amber}
            onChange={v => setData({ ...d, income: v })}
          />
          <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>Used to calculate your capital gains tax rate.</Text>
        </Card>

        {/* Filing status */}
        <Card>
          <SecTitle>Filing status</SecTitle>
          <View style={{ gap: 6 }}>
            {["single", "mfj", "mfs", "hoh"].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setData({ ...d, filingStatus: s })}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 2, borderRadius: 10, padding: 12, borderColor: status === s ? C.amber : C.gray300, backgroundColor: status === s ? C.amberLight : C.card }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: status === s ? C.amber : C.charcoal }}>{FILING_LABELS[s]}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: C.gray500 }}>Exclusion: {fmt(EXCLUSION[s])}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Years owned */}
        <Card>
          <SecTitle>Years owned</SecTitle>
          <SliderRow
            label="Years in this home"
            value={yearsOwned}
            min={0} max={30} step={1}
            display={yearsOwned + " yr"}
            color={C.amber}
            onChange={v => setData({ ...d, yearsOwned: v })}
          />
          {yearsOwned >= 2 ? (
            <Alert type="success">Qualifies for capital gains exclusion — you've owned 2+ years.</Alert>
          ) : (
            <Alert type="warning">Must own 2+ years for the capital gains exclusion.</Alert>
          )}
        </Card>

        {/* Property type */}
        <Card>
          <SecTitle>Property type</SecTitle>
          <View style={{ gap: 6 }}>
            {[
              { v: "primary", icon: "🏠", label: "Primary residence", note: null },
              { v: "investment", icon: "🏢", label: "Investment property", note: "No exclusion — 1031 exchange may apply" },
            ].map(opt => (
              <TouchableOpacity
                key={opt.v}
                onPress={() => setData({ ...d, propertyType: opt.v })}
                style={{ borderWidth: 2, borderRadius: 10, padding: 14, borderColor: propType === opt.v ? C.amber : C.gray300, backgroundColor: propType === opt.v ? C.amberLight : C.card }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: propType === opt.v ? C.amber : C.charcoal }}>{opt.label}</Text>
                </View>
                {propType === opt.v && opt.note && (
                  <Text style={{ fontSize: 11, color: C.gray500, marginTop: 6, marginLeft: 28 }}>{opt.note}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {propType === "investment" && (
          <Card style={{ borderWidth: 1.5, borderColor: C.amber }}>
            <SecTitle>Section 1031 Tax-Deferred Exchange</SecTitle>
            <Text style={{ fontSize: 12, color: C.charcoal, lineHeight: 18 }}>
              A <Text style={{ fontWeight: "700" }}>1031 Exchange</Text> (IRC §1031) allows you to defer all capital gains taxes when you sell an investment property — provided you reinvest the proceeds into a "like-kind" replacement property of equal or greater value within strict IRS deadlines.
            </Text>
            <View style={{ marginTop: 10, gap: 6 }}>
              {[
                { label: "45 days", note: "To identify replacement property after closing" },
                { label: "180 days", note: "To close on the replacement property" },
                { label: "Qualified intermediary", note: "A neutral third party must hold the proceeds — you cannot touch the funds" },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <View style={{ backgroundColor: C.amberLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, minWidth: 68, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: C.amber }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: C.gray500, flex: 1, lineHeight: 16 }}>{item.note}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 10, color: C.gray400, marginTop: 8 }}>Consult a qualified intermediary and tax professional before initiating an exchange.</Text>
          </Card>
        )}

        <NavButtons onNext={onNext} nextLabel="Selling costs →" color={C.amber} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
