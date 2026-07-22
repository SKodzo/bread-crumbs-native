import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { getPropTaxRate } from "../../lib/data";
import { SliderRow, Card, SecTitle, Alert, NavButtons } from "../../components/UI";

// Same transfer tax lookup as SellerCostsScreen
const TRANSFER_TAX_RATE = {
  NY: 4.0, CA: 1.1, PA: 10.0, DC: 14.0, MD: 5.0, NJ: 5.85, CT: 7.5,
  WA: 1.78, IL: 1.0, VA: 1.0, DE: 4.0, NH: 7.5, VT: 6.25, HI: 1.0,
  MA: 4.56, RI: 4.6, MN: 3.3, WI: 3.0, MI: 8.6, NV: 2.55,
};

const calcClosingTotal = (st, homeValue) => {
  const propTaxRate = getPropTaxRate(st);
  const proratedTax = Math.round(homeValue * propTaxRate / 2);
  const titleInsurance = Math.round(homeValue * 0.005);
  const escrow = Math.round(homeValue * 0.01);
  const recording = 250;
  const transferRate = TRANSFER_TAX_RATE[st] || 0;
  const transferTax = Math.round(homeValue / 1000 * transferRate);
  return titleInsurance + escrow + proratedTax + recording + transferTax;
};

const EXCLUSION_AMT = { single: 250000, mfj: 500000, mfs: 250000, hoh: 250000 };

// 2026 long-term capital gains brackets (single)
const capGainsRate = (income, status) => {
  // Simplified: use single thresholds, MFJ roughly double
  const mult = (status === "mfj" || status === "mfs") ? 2 : 1;
  if (income <= 47025 * mult) return 0;
  if (income <= 518900 * mult) return 0.15;
  return 0.20;
};

export default function SellerProceedsScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "TX";
  const status = d.filingStatus || "single";
  const homeValue = d.homeValue || 0;
  const balance = d.mortgageBalance || 0;
  const commPct = d.commissionPct || 5.5;
  const commDollars = Math.round(homeValue * commPct / 100);
  const closingTotal = calcClosingTotal(st, homeValue);
  const prepTotal = (d.repairs || 0) + (d.staging || 0) + (d.photography || 0);
  const grossProceeds = homeValue - commDollars - closingTotal - prepTotal - balance;
  const netProceeds = Math.max(0, grossProceeds);

  // Capital gains
  const originalPrice = d.originalPrice || 0;
  const improvements = d.improvements || 0;
  const costBasis = originalPrice + improvements;
  const gain = Math.max(0, homeValue - costBasis);
  const propType = d.propertyType || "primary";
  const yearsOwned = d.yearsOwned || 0;
  const exclusion = (propType === "primary" && yearsOwned >= 2) ? (EXCLUSION_AMT[status] || 250000) : 0;
  const taxableGain = Math.max(0, gain - exclusion);
  const rate = capGainsRate(d.income || 0, status);
  const capGainsTax = Math.round(taxableGain * rate);
  const finalNet = Math.max(0, netProceeds - capGainsTax);

  const ratePct = (rate * 100).toFixed(0);

  const WaterfallRow = ({ label, value, negative }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.gray200 }}>
      <Text style={{ fontSize: 13, color: C.charcoal, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: negative ? C.red : C.text }}>
        {negative ? "– " : ""}{fmt(Math.abs(value))}
      </Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Sale waterfall */}
      <Card>
        <SecTitle>Sale waterfall</SecTitle>
        <WaterfallRow label="Sale price" value={homeValue} />
        <WaterfallRow label={`Commission (${commPct}%)`} value={commDollars} negative />
        <WaterfallRow label="Closing costs" value={closingTotal} negative />
        <WaterfallRow label="Pre-sale prep" value={prepTotal} negative />
        <WaterfallRow label="Mortgage payoff" value={balance} negative />
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal }}>Net proceeds</Text>
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.amber }}>{fmt(netProceeds)}</Text>
        </View>
      </Card>

      {/* What you walk away with */}
      <Card>
        <View style={{ padding: 16, backgroundColor: C.greenLight, borderRadius: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.green, textTransform: "uppercase", letterSpacing: 0.5 }}>What you walk away with</Text>
          <Text style={{ fontSize: 32, fontWeight: "900", color: C.green, marginTop: 6 }}>{fmt(finalNet)}</Text>
          <Text style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>After costs, payoff, and capital gains tax</Text>
        </View>
      </Card>

      {/* Capital gains */}
      <Card>
        <SecTitle>Capital gains breakdown</SecTitle>

        <SliderRow
          label="Original purchase price"
          value={originalPrice}
          min={0} max={2000000} step={5000}
          display={fmt(originalPrice)}
          color={C.amber}
          onChange={v => setData({ ...d, originalPrice: v })}
        />

        <SliderRow
          label="Improvements made"
          value={improvements}
          min={0} max={200000} step={1000}
          display={fmt(improvements)}
          color={C.amber}
          onChange={v => setData({ ...d, improvements: v })}
        />
        <Text style={{ fontSize: 11, color: C.gray500, marginTop: 2, marginBottom: 8 }}>Improvements increase your cost basis, reducing taxable gain.</Text>

        <View style={{ gap: 6, marginTop: 4 }}>
          {[
            { label: "Cost basis", value: fmt(costBasis), sub: `${fmt(originalPrice)} + ${fmt(improvements)}` },
            { label: "Total gain", value: fmt(gain), sub: `${fmt(homeValue)} – ${fmt(costBasis)}` },
            { label: "Exclusion", value: fmt(exclusion), sub: propType === "investment" ? "No exclusion (investment)" : yearsOwned < 2 ? "Need 2+ years" : `${status === "mfj" ? "MFJ" : "Single"} exclusion` },
            { label: "Taxable gain", value: fmt(taxableGain) },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.gray200 }}>
              <View>
                <Text style={{ fontSize: 13, color: C.charcoal }}>{row.label}</Text>
                {row.sub && <Text style={{ fontSize: 10, color: C.gray400, marginTop: 1 }}>{row.sub}</Text>}
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 10, padding: 10, backgroundColor: C.amberLight, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.amber }}>
            At your income of {fmtK(d.income || 0)}, your long-term rate is {ratePct}%
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.charcoal }}>Capital gains tax</Text>
            <Text style={{ fontSize: 16, fontWeight: "900", color: capGainsTax > 0 ? C.red : C.green }}>{fmt(capGainsTax)}</Text>
          </View>
        </View>

        {/* Capital gains rationale */}
        <View style={{ marginTop: 10, padding: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.text, marginBottom: 4 }}>Why is my capital gains tax {capGainsTax === 0 ? "$0" : fmt(capGainsTax) + "?"}?</Text>
          {taxableGain === 0 && exclusion > 0 ? (
            <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>
              Under <Text style={{ fontWeight: "700" }}>IRC §121</Text>, {status === "mfj" ? "married couples filing jointly" : "single filers"} who've lived in their primary residence for 2+ of the last 5 years may exclude up to <Text style={{ fontWeight: "700" }}>{fmt(EXCLUSION_AMT[status])}</Text> of capital gains. Your total gain ({fmt(gain)}) is fully covered by this exclusion.
            </Text>
          ) : propType === "investment" ? (
            <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>
              Investment properties don't qualify for the §121 exclusion. Your full gain of {fmt(gain)} is taxable at your long-term rate of {ratePct}%. A <Text style={{ fontWeight: "700" }}>1031 Exchange</Text> could defer this tax.
            </Text>
          ) : yearsOwned < 2 ? (
            <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>
              You must own and occupy the property for at least <Text style={{ fontWeight: "700" }}>2 of the last 5 years</Text> to qualify for the §121 exclusion. At {yearsOwned} year{yearsOwned !== 1 ? "s" : ""} owned, the full gain of {fmt(gain)} is taxable at {ratePct}%.
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: C.gray500, lineHeight: 16 }}>
              After the §121 exclusion of {fmt(exclusion)}, your taxable gain is {fmt(taxableGain)} — taxed at your {ratePct}% long-term rate.
            </Text>
          )}
        </View>
      </Card>

      {/* Final net */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: C.amberLight, borderRadius: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal }}>Final net after tax</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: C.amber }}>{fmt(finalNet)}</Text>
        </View>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Timing & strategy →" color={C.amber} />

    </ScrollView>
  );
}
