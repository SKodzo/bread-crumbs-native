
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt, fmtK } from "../../lib/math";
import { federalTax, ficaTax } from "../../lib/tax";
import { stateTax } from "../../lib/stateTax";
import { getUtilities } from "../../lib/data";
import { Card, SecTitle, Alert, SliderRow, NavButtons } from "../../components/UI";

// Monthly pet rent averages by state ($/pet/mo) — compiled from Zillow/RentCafe surveys
const PET_RENT_AVG = {
  CA: 75, NY: 70, WA: 65, MA: 65, CO: 60, OR: 60, IL: 55, NJ: 55,
  TX: 50, FL: 50, GA: 50, NC: 45, AZ: 45, NV: 45, VA: 45, TN: 40,
  MN: 40, OH: 40, PA: 40, MI: 40, MO: 35, WI: 35, IN: 35, KY: 35,
  SC: 35, AL: 30, MS: 30, AR: 30, LA: 35, OK: 35, KS: 35, NE: 35,
  IA: 30, ND: 30, SD: 30, MT: 35, ID: 40, UT: 45, NM: 35, WY: 30,
  AK: 50, HI: 65, ME: 40, NH: 45, VT: 40, CT: 55, RI: 55, DE: 45,
  MD: 55, DC: 80,
};

const DEPOSIT_NOTES = {
  TX: "TX has no cap on security deposits",
  CA: "CA caps deposits at 1 month's rent (unfurnished)",
  NY: "NY caps deposits at 1 month's rent",
  IL: "IL has no statewide deposit cap",
  FL: "FL has no cap on security deposits",
  OH: "OH has no cap on security deposits",
  GA: "GA has no cap on security deposits",
  WA: "WA has no cap on security deposits",
  MA: "MA caps deposits at 1 month's rent",
  NJ: "NJ caps deposits at 1.5 months' rent",
};

function Row({ label, value, valueColor, bold }) {
  const C = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
      <Text style={{ fontSize: 12, color: C.gray700, flex: 1, paddingRight: 8 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: bold ? "900" : "700", color: valueColor || C.charcoal }}>{value}</Text>
    </View>
  );
}

export default function RentResultsScreen({ data, setData, onNext, onBack }) {
  const C = useTheme();
  const d = data;
  const st = d.locationInfo?.state || "";
  const status = d.filingStatus || "single";
  const grossYr = d.income || 0;
  const grossMo = Math.round(grossYr / 12);
  const fedTaxYr = federalTax({ gross: grossYr, status });
  const ficaYr = ficaTax(grossYr, status);
  const stateTaxYr = stateTax(st, grossYr);
  const totalTaxYr = fedTaxYr + ficaYr + stateTaxYr;
  const taxMo = Math.round(totalTaxYr / 12);
  const takeHome = grossMo - taxMo;

  const splitCount = (d.roommates || 0) + 1;

  // Three tiers based on gross monthly
  const conservative = Math.round(grossMo * 0.25);
  const standard = Math.round(grossMo * 0.30);
  const stretch = Math.round(grossMo * 0.35);

  // Shared costs
  const utilTotal = d.rentalType === "house" ? getUtilities(st) : Math.round(getUtilities(st) * 0.7);
  const sharedUtil = Math.round(utilTotal / splitCount);
  const insuranceFull = d.rentalType === "house" ? 35 : 20;
  const sharedInsurance = Math.round(insuranceFull / splitCount);

  // Personal expenses
  const personal = (d.groc || 0) + (d.dining || 0) + (d.ent || 0) + (d.pcare || 0) + (d.car || 0) + (d.childcare || 0) + (d.healthcare || 0) + (d.education || 0) + (d.misc || 0);
  const debtTotal = (d.debts || 0) + (d.student || 0);
  const savings = d.monthlySavingsContribution || 0;

  // Use standard tier for breakdown
  const rentShare = Math.round(standard / splitCount);
  const petRentCount = d.petCount ?? 0;
  const petRentMo = petRentCount * (d.petRentPerPet ?? (PET_RENT_AVG[st] || 40));
  const buffer = takeHome - rentShare - sharedUtil - sharedInsurance - personal - debtTotal - savings - petRentMo;

  // Move-in costs — persisted in data so Step 4 can read them
  const depositMonths   = d.depositMonths   ?? 1;
  const appFeeOverride  = d.appFeeOverride  ?? null;
  const adminFee        = d.adminFee        ?? 200;
  const petCount        = d.petCount        ?? 0;
  const petFeePerPet    = d.petFeePerPet    ?? 300;
  const petRentPerPet   = d.petRentPerPet   ?? (PET_RENT_AVG[st] || 40);
  const elec            = d.elec            ?? 80;
  const internet        = d.internet        ?? 60;
  const water           = d.water           ?? 40;
  const trash           = d.trash           ?? 20;

  const set = (key, val) => setData({ ...d, [key]: val });

  // App fee is per applicant (each roommate applies separately)
  const defaultAppFeePerPerson = 75;
  const appFeePerPerson = appFeeOverride !== null ? appFeeOverride : defaultAppFeePerPerson;
  const appFeeTotal = appFeePerPerson * splitCount;
  const petDeposit = petCount * petFeePerPet;
  const petRentTotal = petCount * petRentPerPet;
  const depositAmt = Math.max(0, Math.round(standard * depositMonths));
  const moveInTotal = standard + depositAmt + appFeeTotal + adminFee + petDeposit;
  const utilBreakdown = elec + internet + water + trash;

  // Landlord screening
  const income3x = grossMo >= standard * 3;
  const credit620 = (d.score || d.creditScore || 0) >= 620;

  const depositNote = DEPOSIT_NOTES[st] || null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Rent tiers */}
      <Card>
        <SecTitle>What rent can you afford?</SecTitle>
        <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>Based on {fmt(grossMo)}/mo gross income</Text>

        {[
          { label: "Conservative (25%)", total: conservative, color: C.green },
          { label: "Standard (30%)", total: standard, color: C.blue },
          { label: "Stretch (35%)", total: stretch, color: C.amber },
        ].map((tier, i) => {
          const share = Math.round(tier.total / splitCount);
          return (
            <View key={i} style={{ backgroundColor: tier.color + "12", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: tier.color, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>{tier.label}</Text>
              <Text style={{ fontSize: 22, fontWeight: "900", color: tier.color }}>{fmt(tier.total)}/mo</Text>
              {splitCount > 1 && (
                <Text style={{ fontSize: 12, fontWeight: "700", color: tier.color, marginTop: 2 }}>Your share: {fmt(share)}/mo (split {splitCount} ways)</Text>
              )}
            </View>
          );
        })}
      </Card>

      {/* Monthly breakdown */}
      <Card>
        <SecTitle>Monthly breakdown (standard tier)</SecTitle>
        <Row label="Gross income" value={fmt(grossMo)} bold />
        <Row label="Federal + FICA + state tax" value={`−${fmt(taxMo)}`} valueColor={C.red} />
        <Row label="Take-home pay" value={fmt(takeHome)} valueColor={C.green} bold />
        <View style={{ height: 8 }} />
        <Row label={splitCount > 1 ? `Rent (your share of ${fmt(standard)})` : "Rent (standard)"} value={`−${fmt(rentShare)}`} valueColor={C.blue} />
        <Row label={splitCount > 1 ? `Utilities (your share of ${fmt(utilTotal)})` : "Utilities"} value={`−${fmt(sharedUtil)}`} />
        <Row label={splitCount > 1 ? `Renter's insurance (your share)` : "Renter's insurance"} value={`−${fmt(sharedInsurance)}`} />
        <Row label="Personal expenses" value={`−${fmt(personal)}`} />
        <Row label="Debt payments" value={`−${fmt(debtTotal)}`} valueColor={debtTotal > 0 ? C.red : undefined} />
        {petRentMo > 0 && <Row label={`Pet rent (${petRentCount} pet${petRentCount > 1 ? "s" : ""})`} value={`−${fmt(petRentMo)}`} valueColor={C.blue} />}
        <Row label="Savings" value={`−${fmt(savings)}`} valueColor={C.green} />
        <View style={{ height: 6 }} />
        <Row label="Buffer remaining" value={fmt(buffer)} valueColor={buffer >= 0 ? C.green : C.red} bold />
        {buffer < 0 && (
          <Alert type="danger">You're {fmt(Math.abs(buffer))}/mo short at the standard tier. Consider the conservative tier or reducing expenses.</Alert>
        )}
        {buffer >= 0 && buffer < 100 && (
          <Alert type="warning">Your buffer is tight. Unexpected expenses could push you over budget.</Alert>
        )}
      </Card>

      {/* Move-in costs */}
      <Card>
        <SecTitle>Estimated move-in costs</SecTitle>
        <Row label="First month's rent" value={fmt(standard)} />
        <Row label={`Security deposit`} value={depositMonths === 0 ? "Waived" : fmt(depositAmt)} />
        <SliderRow label="Deposit" min={0} max={3} step={0.5} value={depositMonths} onChange={v => set("depositMonths", v)} display={depositMonths === 0 ? "Waived" : `${depositMonths} mo`} color={C.blue} note="Adjust based on landlord requirements (0 = deposit-free)" />

        <Row label={splitCount > 1 ? `Application fee (${splitCount} applicants × ${fmt(appFeePerPerson)})` : "Application fee"} value={appFeePerPerson === 0 ? "Waived" : fmt(appFeeTotal)} />
        <SliderRow label="App fee per person" min={0} max={200} step={5} value={appFeePerPerson} onChange={v => set("appFeeOverride", v)} display={appFeePerPerson === 0 ? "Waived" : fmt(appFeePerPerson)} color={C.blue} note={splitCount > 1 ? `Each roommate pays separately · total: ${fmt(appFeeTotal)}` : "Per applicant · $0 = waived/free listing"} />

        <Row label="Administrative fee (one-time)" value={adminFee === 0 ? "Waived" : fmt(adminFee)} />
        <SliderRow label="Admin fee" min={0} max={500} step={25} value={adminFee} onChange={v => set("adminFee", v)} display={adminFee === 0 ? "Waived" : fmt(adminFee)} color={C.blue} note="One-time non-refundable fee charged by some properties ($0 = none)" />

        {/* Pet fees */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 4 }}>Pets</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            {[0, 1, 2, 3].map(n => (
              <TouchableOpacity key={n} onPress={() => set("petCount", n)} style={{ flex: 1, borderWidth: 2, borderRadius: 8, padding: 8, alignItems: "center", borderColor: petCount === n ? C.blue : C.gray300, backgroundColor: petCount === n ? C.blueLight : C.card }} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: petCount === n ? C.blue : C.charcoal }}>{n === 0 ? "None" : n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {petCount > 0 && (
            <>
              <SliderRow label="One-time deposit per pet" min={0} max={1000} step={50} value={petFeePerPet} onChange={v => set("petFeePerPet", v)} display={fmt(petFeePerPet)} color={C.blue} note={`Non-refundable · total: ${fmt(petDeposit)}`} />
              <SliderRow label="Monthly pet rent per pet" min={0} max={150} step={5} value={petRentPerPet} onChange={v => set("petRentPerPet", v)} display={fmt(petRentPerPet) + "/mo"} color={C.blue} note={`${st ? st + " avg" : "national avg"}: ${fmt(PET_RENT_AVG[st] || 40)}/pet/mo · total: ${fmt(petRentTotal)}/mo added to monthly costs`} />
            </>
          )}
        </View>

        <View style={{ height: 8 }} />
        <Row label="Total move-in cash needed" value={fmt(moveInTotal)} valueColor={C.blue} bold />

        {depositNote && (
          <Alert type="info">{depositNote}</Alert>
        )}
      </Card>

      {/* Utility breakdown */}
      <Card>
        <SecTitle>Estimated monthly utilities</SecTitle>
        <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 8 }}>Customize for your area and unit size</Text>
        <SliderRow label="Electricity" min={0} max={300} step={5} value={elec} onChange={v => set("elec", v)} display={fmt(elec)} color={C.blue} />
        <SliderRow label="Internet / fiber" min={0} max={150} step={5} value={internet} onChange={v => set("internet", v)} display={fmt(internet)} color={C.blue} />
        <SliderRow label="Water / sewage" min={0} max={150} step={5} value={water} onChange={v => set("water", v)} display={fmt(water)} color={C.blue} />
        <SliderRow label="Trash removal" min={0} max={60} step={5} value={trash} onChange={v => set("trash", v)} display={fmt(trash)} color={C.blue} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Total utilities</Text>
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.blue }}>{fmt(utilBreakdown)}/mo</Text>
        </View>
      </Card>

      {/* Landlord screening */}
      <Card>
        <SecTitle>Landlord screening checklist</SecTitle>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>Income ≥ 3× rent ({fmt(standard * 3)}/mo)</Text>
          <View style={{ backgroundColor: income3x ? C.greenPale : C.redLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: income3x ? C.green : C.red }}>{income3x ? "PASS" : "FAIL"}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: C.gray700 }}>Credit score ≥ 620 ({d.score || d.creditScore || "N/A"})</Text>
          <View style={{ backgroundColor: credit620 ? C.greenPale : C.redLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: credit620 ? C.green : C.red }}>{credit620 ? "PASS" : "FAIL"}</Text>
          </View>
        </View>
        {!income3x && (
          <Alert type="warning">Most landlords require income of at least 3× monthly rent. A co-signer or larger deposit may help.</Alert>
        )}
        {!credit620 && (
          <Alert type="warning">Many landlords require a credit score of 620+. A co-signer or proof of stable income history may help.</Alert>
        )}
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} accent={C.blue} />
    </ScrollView>
  );
}
