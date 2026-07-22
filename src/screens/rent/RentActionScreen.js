import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt } from "../../lib/math";
import { Card, SecTitle, NavButtons } from "../../components/UI";

const PHASES = [
  {
    id: "application",
    label: "Application & Approval",
    emoji: "📋",
    timing: "Before you apply",
    items: [
      "Pull your credit report at annualcreditreport.com — fix errors before landlord checks",
      "Gather proof of income: last 2 pay stubs, last 2 years of tax returns (W-2s)",
      "Get a reference letter from your current landlord if possible",
      "Prepare 2–3 personal or professional references with contact info",
      "Have your bank statements ready (last 2–3 months) to show rent × 3 in savings",
      "If self-employed: prepare a profit & loss statement and 1099s",
      "Check your rental history — resolve any prior evictions or disputes",
      "Budget and submit your application fee (typically $50–$100 per person)",
    ],
  },
  {
    id: "lease",
    label: "Signing the Lease",
    emoji: "✍️",
    timing: "Lease signing day",
    items: [
      "Read the entire lease before signing — don't skim",
      "Confirm the exact monthly rent, due date, and grace period",
      "Check the lease end date and auto-renewal or notice-to-vacate terms",
      "Clarify what's included: parking, storage, laundry, trash, water",
      "Confirm pet policy, fees, and monthly pet rent in writing",
      "Ask about guest policies and subletting rules",
      "Understand the early termination clause and fees",
      "Verify who is responsible for each utility — get it in writing",
      "Confirm maintenance request process and emergency contact number",
      "Get the security deposit receipt and confirm the refund timeline",
    ],
  },
  {
    id: "before_move",
    label: "2–4 Weeks Before Moving",
    emoji: "📦",
    timing: "4 weeks out",
    items: [
      "Book your moving truck or moving company — prices spike on weekends and end of month",
      "Get at least 3 quotes if using movers; check reviews on Google and Yelp",
      "Start decluttering — donate or sell what you won't bring",
      "Order packing supplies: boxes, tape, bubble wrap, markers",
      "Set up renter's insurance (required by most landlords) — takes 15 minutes online",
      "Notify USPS of your address change at usps.com/move",
      "Update your address with your bank, employer, and subscriptions",
      "Transfer or set up utilities: electricity, gas, water if tenant-responsible",
      "Schedule internet/cable installation — providers book out 1–2 weeks",
      "Notify your current landlord of your move-out date per lease terms",
    ],
  },
  {
    id: "move_day",
    label: "Move-In Day",
    emoji: "🚚",
    timing: "Move-in day",
    items: [
      "Do a thorough walk-through before unloading — document every scratch, dent, and stain",
      "Take timestamped photos and video of every room, closet, appliance, and wall",
      "Email the photo documentation to your landlord the same day — creates a paper trail",
      "Test every outlet, light switch, appliance, faucet, and toilet",
      "Check that all windows and doors lock properly",
      "Locate the circuit breaker, water shutoff valve, and gas shutoff",
      "Get all keys, fobs, and gate codes — confirm how many copies you're entitled to",
      "Deep clean the unit before unboxing — easier than cleaning around furniture",
      "Set up bed and essentials first so you're not stranded at midnight",
      "Introduce yourself to neighbors — they'll tell you things the landlord won't",
    ],
  },
  {
    id: "first_week",
    label: "First Week",
    emoji: "🏠",
    timing: "Days 1–7",
    items: [
      "Submit any maintenance requests in writing (app or email — not verbal)",
      "Confirm your first rent payment method and due date",
      "Test smoke detectors and carbon monoxide detectors — replace batteries if needed",
      "Locate the nearest laundry, grocery store, pharmacy, and urgent care",
      "Set up auto-pay for rent so you never miss a payment",
      "Update your driver's license address (required by law in most states within 30 days)",
      "Register your vehicle if you moved to a new county or state",
      "Update voter registration if applicable at vote.org",
      "Set a calendar reminder for lease renewal notice (usually 60 days before end)",
      "Find out trash and recycling pickup days and bin locations",
    ],
  },
  {
    id: "getting_settled",
    label: "Getting Settled",
    emoji: "✅",
    timing: "First month",
    items: [
      "Build an emergency contact list: landlord, maintenance, building manager, utility companies",
      "Get renter's insurance certificate to your landlord if required",
      "Set up a dedicated folder (physical or digital) for all lease docs and receipts",
      "Take a second round of photos once furniture is in — for insurance purposes",
      "Introduce yourself to building management and get on their good list early",
      "Learn the parking rules — towing is expensive and happens fast",
      "Figure out package delivery: mailroom, lockers, or contact your carrier",
      "Test your renters insurance app or hotline — know how to file a claim",
      "Buy a few basic tools: hammer, screwdriver set, level, and a stud finder",
      "Enjoy your new place — you earned it",
    ],
  },
];

function CheckItem({ text, checked, onPress }) {
  const C = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}
    >
      <View style={{
        width: 20, height: 20, borderRadius: 5, borderWidth: 2,
        borderColor: checked ? C.blue : C.gray300,
        backgroundColor: checked ? C.blue : "transparent",
        marginRight: 10, marginTop: 1, flexShrink: 0,
        alignItems: "center", justifyContent: "center",
      }}>
        {checked && <Text style={{ fontSize: 11, color: "#fff", fontWeight: "900" }}>✓</Text>}
      </View>
      <Text style={{
        fontSize: 13, color: checked ? C.gray400 : C.text,
        textDecorationLine: checked ? "line-through" : "none",
        flex: 1, lineHeight: 19,
      }}>{text}</Text>
    </TouchableOpacity>
  );
}

export default function RentActionScreen({ data, onBack, onSwitchMode, onDone }) {
  const C = useTheme();
  const d = data;

  // checked[phaseId][idx] = true/false
  const [checked, setChecked] = useState({});

  const toggle = (phaseId, idx) => {
    setChecked(prev => ({
      ...prev,
      [phaseId]: { ...(prev[phaseId] || {}), [idx]: !(prev[phaseId]?.[idx]) },
    }));
  };

  const totalItems = PHASES.reduce((s, p) => s + p.items.length, 0);
  const doneItems  = Object.values(checked).reduce((s, phase) =>
    s + Object.values(phase).filter(Boolean).length, 0);
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Progress card */}
      <Card style={{ borderWidth: 1.5, borderColor: C.blue }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.blue }}>Move-in progress</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: C.blue }}>{pct}%</Text>
        </View>
        <View style={{ height: 8, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginBottom: 6 }}>
          <View style={{ height: "100%", borderRadius: 99, width: `${pct}%`, backgroundColor: C.blue }} />
        </View>
        <Text style={{ fontSize: 11, color: C.gray500 }}>{doneItems} of {totalItems} tasks complete</Text>
      </Card>

      {/* Phase cards */}
      {PHASES.map(phase => {
        const phaseChecked = checked[phase.id] || {};
        const phaseDone = Object.values(phaseChecked).filter(Boolean).length;
        const phaseTotal = phase.items.length;
        const allDone = phaseDone === phaseTotal;

        return (
          <Card key={phase.id} style={allDone ? { borderWidth: 1.5, borderColor: C.blue } : {}}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 18 }}>{phase.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: allDone ? C.blue : C.text }}>{phase.label}</Text>
              </View>
              <View style={{ backgroundColor: allDone ? C.blue : C.gray100, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: allDone ? "#fff" : C.gray500 }}>{phaseDone}/{phaseTotal}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: C.gray400, marginBottom: 10 }}>{phase.timing}</Text>
            {phase.items.map((item, idx) => (
              <CheckItem
                key={idx}
                text={item}
                checked={!!phaseChecked[idx]}
                onPress={() => toggle(phase.id, idx)}
              />
            ))}
          </Card>
        );
      })}

      {/* Move-in cost reminder */}
      {(d.targetRent || 0) > 0 && (
        <Card style={{ borderWidth: 1, borderColor: C.gray200 }}>
          <SecTitle>Your move-in numbers</SecTitle>
          {[
            ["Target rent", fmt(d.targetRent || 0) + "/mo"],
            ["Move-in cash needed", (() => {
              const splitCount = (d.roommates || 0) + 1;
              const depositAmt = Math.round((d.targetRent || 0) * (d.depositMonths ?? 1));
              const appFee = (d.appFeeOverride ?? 75) * splitCount;
              const adminFee = d.adminFee ?? 200;
              const petDeposit = (d.petCount || 0) * (d.petFeePerPet || 300);
              return fmt((d.targetRent || 0) + depositAmt + appFee + adminFee + petDeposit);
            })()],
            ["Current savings", fmt(d.currentSavings || 0)],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
              <Text style={{ fontSize: 12, color: C.gray500 }}>{label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "800", color: C.text }}>{value}</Text>
            </View>
          ))}
        </Card>
      )}

      <NavButtons onBack={onBack} nextLabel={pct === 100 ? "All done 🎉" : "Done"} onNext={() => { onDone && onDone(); onSwitchMode && onSwitchMode(null); }} accent={C.blue} />

    </ScrollView>
  );
}
