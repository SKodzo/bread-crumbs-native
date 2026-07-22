import { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { useThemeColors } from "../../lib/theme";
import { StepDots } from "../../components/UI";
import { supabase } from "../../lib/supabase";
import FlowMenu from "../../components/FlowMenu";
import { RENTER_INITIAL } from "../../../App";
import RentProfileScreen from "./RentProfileScreen";
import RentBudgetScreen from "./RentBudgetScreen";
import RentResultsScreen from "./RentResultsScreen";
import RentSavingsScreen from "./RentSavingsScreen";
import RentNearbyScreen from "./RentNearbyScreen";
import RentActionScreen from "./RentActionScreen";

const RENT_STEPS = [
  { id: 1, label: "Profile",  title: "Your profile" },
  { id: 2, label: "Budget",   title: "Monthly expenses" },
  { id: 3, label: "Results",  title: "What you can afford" },
  { id: 4, label: "Savings",  title: "Your target rent" },
  { id: 5, label: "Nearby",   title: "Nearby areas" },
  { id: 6, label: "Plan",     title: "Move-in action plan" },
];

async function saveRentProgress(userId, data, step) {
  try {
    await supabase.from("user_progress").upsert(
      { user_id: userId, renter_data: data, renter_step: step, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch (_) {}
}

async function loadRentProgress(userId) {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("renter_data, renter_step")
      .eq("user_id", userId)
      .single();
    if (error) return null;
    return data;
  } catch (_) { return null; }
}

export default function RentApp({ session, onSwitchMode, sharedProfile, onUpdateSharedProfile }) {
  const C = useThemeColors();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [data, setData] = useState(RENTER_INITIAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadRentProgress(session.user.id);
      if (saved?.renter_data) {
        const merged = { ...saved.renter_data, income: saved.renter_data.income || sharedProfile.income, filingStatus: saved.renter_data.filingStatus || sharedProfile.filingStatus, score: saved.renter_data.score || sharedProfile.score };
        setData(merged);
        setStep(saved.renter_step || 1);
        setMaxStep(saved.renter_step || 1);
      } else {
        setData(prev => ({ ...prev, income: sharedProfile.income, filingStatus: sharedProfile.filingStatus, score: sharedProfile.score }));
      }
      setLoading(false);
    })();
  }, []);

  const goTo = async (s) => {
    setStep(s);
    if (s > maxStep) setMaxStep(s);
    await saveRentProgress(session.user.id, data, s);
  };

  const updateData = async (newData) => {
    setData(newData);
    if (newData.income !== data.income || newData.filingStatus !== data.filingStatus || newData.score !== data.score) {
      onUpdateSharedProfile({ income: newData.income, filingStatus: newData.filingStatus, score: newData.score });
    }
    await saveRentProgress(session.user.id, newData, step);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={{ marginTop: 12, color: C.gray500, fontWeight: "600" }}>Loading...</Text>
      </View>
    );
  }

  const currentStep = RENT_STEPS[step - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.header }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.header }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => onSwitchMode(null)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} activeOpacity={0.7}>
            <Image source={require("../../../assets/logo.png")} style={{ width: 54, height: 54, resizeMode: "contain" }} />
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.blue, letterSpacing: -0.3 }}>Bread Crumbs</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.gray500 }}>Step {step} of {RENT_STEPS.length}</Text>
          <FlowMenu onSwitchMode={onSwitchMode} session={session} />
        </View>
      </View>

      <StepDots current={step} total={RENT_STEPS.length} color={C.blue} onPress={s => s <= maxStep && goTo(s)} />

      {/* Page title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: C.bg }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.4 }}>🏢 {currentStep.title}</Text>
      </View>

      {step === 1 && <RentProfileScreen data={data} setData={updateData} onNext={() => goTo(2)} />}
      {step === 2 && <RentBudgetScreen data={data} setData={updateData} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
      {step === 3 && <RentResultsScreen data={data} setData={updateData} onNext={() => goTo(4)} onBack={() => goTo(2)} />}
      {step === 4 && <RentSavingsScreen data={data} setData={updateData} onNext={() => goTo(5)} onBack={() => goTo(3)} />}
      {step === 5 && <RentNearbyScreen data={data} onBack={() => goTo(4)} onNext={() => goTo(6)} />}
      {step === 6 && <RentActionScreen data={data} onBack={() => goTo(5)} onDone={() => saveRentProgress(session.user.id, data, 6)} onSwitchMode={onSwitchMode} />}
    </SafeAreaView>
  );
}
