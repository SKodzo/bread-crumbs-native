import { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import FlowMenu from "../../components/FlowMenu";
import { useThemeColors } from "../../lib/theme";
import { StepDots } from "../../components/UI";
import { supabase } from "../../lib/supabase";
import { SELLER_INITIAL } from "../../../App";
import SellerProfileScreen from "./SellerProfileScreen";
import SellerCostsScreen from "./SellerCostsScreen";
import SellerProceedsScreen from "./SellerProceedsScreen";
import SellerTimingScreen from "./SellerTimingScreen";
import SellerActionScreen from "./SellerActionScreen";

const SELL_STEPS = [
  { id: 1, label: "Home", title: "Your home" },
  { id: 2, label: "Costs", title: "Selling costs" },
  { id: 3, label: "Proceeds", title: "Net proceeds" },
  { id: 4, label: "Timing", title: "Timing and strategy" },
  { id: 5, label: "Action", title: "Seller action plan" },
];

async function saveSellerProgress(userId, data, step) {
  try {
    await supabase.from("user_progress").upsert(
      { user_id: userId, seller_data: data, seller_step: step, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch (_) {}
}

async function loadSellerProgress(userId) {
  try {
  const { data, error } = await supabase
    .from("user_progress")
    .select("seller_data, seller_step")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
  } catch (_) { return null; }
}

export default function SellerApp({ session, onSwitchMode, sharedProfile, onUpdateSharedProfile }) {
  const C = useThemeColors();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [data, setData] = useState(SELLER_INITIAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadSellerProgress(session.user.id);
      if (saved?.seller_data) {
        const merged = { ...saved.seller_data, income: saved.seller_data.income || sharedProfile.income, filingStatus: saved.seller_data.filingStatus || sharedProfile.filingStatus };
        setData(merged);
        setStep(saved.seller_step || 1);
        setMaxStep(saved.seller_step || 1);
      } else {
        setData(prev => ({ ...prev, income: sharedProfile.income, filingStatus: sharedProfile.filingStatus }));
      }
      setLoading(false);
    })();
  }, []);

  const goTo = async (s) => {
    setStep(s);
    if (s > maxStep) setMaxStep(s);
    await saveSellerProgress(session.user.id, data, s);
  };

  const updateData = async (newData) => {
    setData(newData);
    if (newData.income !== data.income || newData.filingStatus !== data.filingStatus) {
      onUpdateSharedProfile({ income: newData.income, filingStatus: newData.filingStatus });
    }
    await saveSellerProgress(session.user.id, newData, step);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.amber} />
        <Text style={{ marginTop: 12, color: C.gray500, fontWeight: "600" }}>Loading...</Text>
      </View>
    );
  }

  const currentStep = SELL_STEPS[step - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.header }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.header }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => onSwitchMode(null)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} activeOpacity={0.7}>
            <Image source={require("../../../assets/logo.png")} style={{ width: 54, height: 54, resizeMode: "contain" }} />
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.amber, letterSpacing: -0.3 }}>Bread Crumbs</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.gray500 }}>Step {step} of {SELL_STEPS.length}</Text>
          <FlowMenu onSwitchMode={onSwitchMode} session={session} />
        </View>
      </View>

      <StepDots current={step} total={SELL_STEPS.length} color={C.amber} />

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: C.bg }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.4 }}>💰 {currentStep.title}</Text>
      </View>

      {step === 1 && <SellerProfileScreen data={data} setData={updateData} onNext={() => goTo(2)} />}
      {step === 2 && <SellerCostsScreen data={data} setData={updateData} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
      {step === 3 && <SellerProceedsScreen data={data} setData={updateData} onNext={() => goTo(4)} onBack={() => goTo(2)} />}
      {step === 4 && <SellerTimingScreen data={data} setData={updateData} onNext={() => goTo(5)} onBack={() => goTo(3)} onSwitchMode={onSwitchMode} />}
      {step === 5 && <SellerActionScreen data={data} onBack={() => goTo(4)} onDone={() => saveSellerProgress(session.user.id, data, 5)} onSwitchMode={onSwitchMode} />}
    </SafeAreaView>
  );
}
