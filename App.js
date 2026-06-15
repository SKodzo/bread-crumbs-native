import { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { C } from "./src/lib/colors";
import { usePrograms } from "./src/lib/usePrograms";
import { supabase } from "./src/lib/supabase";
import AuthScreen from "./src/screens/AuthScreen";
import LocationScreen from "./src/screens/LocationScreen";
import IncomeScreen from "./src/screens/IncomeScreen";
import HomeScreen from "./src/screens/HomeScreen";

const Stack = createNativeStackNavigator();

export const STEPS = [
  { id:1, label:"Location",    icon:"📍", title:"Where are you buying?"        },
  { id:2, label:"Income",      icon:"💰", title:"Your income & savings"         },
  { id:3, label:"Home",        icon:"🏠", title:"Your target home"              },
  { id:4, label:"Loan",        icon:"🏦", title:"Choose your loan"              },
  { id:5, label:"Programs",    icon:"🎯", title:"Available programs"            },
  { id:6, label:"Budget",      icon:"📊", title:"Monthly spending"              },
  { id:7, label:"Ratios",      icon:"📐", title:"Underwriting ratios"           },
  { id:8, label:"Results",     icon:"✨", title:"Your full picture"             },
  { id:9, label:"Action Plan", icon:"✅", title:"Your personalized action plan" },
];

const INITIAL_DATA = {
  zip: "", locationInfo: null, isFirstTime: undefined,
  householdSize: 1, isRenting: undefined, monthlyRent: 1500,
  income: 86000, alimony: 0, k401: 3000, roth: 1000, hsa: 0,
  profession: "none", isVet: false,
  score: 740, dpPct: 5, debts: 300,
  price: 340000, loanType: "fha", loanTerm: 360,
  programs: [], student: 0,
  groc: 400, dining: 200, ent: 150, pcare: 150, car: 500, efund: 300,
};

function StepBar({ step, maxStep, onGoTo }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <View key={s.id} style={styles.stepCell}>
          <TouchableOpacity
            disabled={s.id > maxStep}
            onPress={() => s.id <= maxStep && onGoTo(s.id)}
            style={[
              styles.stepDot,
              s.id < step   && styles.stepDotDone,
              s.id === step && styles.stepDotCurrent,
              s.id > step && s.id <= maxStep && styles.stepDotUnlocked,
              s.id > maxStep && styles.stepDotLocked,
            ]}
          >
            <Text style={[styles.stepIcon, s.id <= step && { color: C.white }]}>
              {s.id < step ? "✓" : s.icon}
            </Text>
          </TouchableOpacity>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, s.id < step && styles.stepLineDone]} />
          )}
        </View>
      ))}
    </View>
  );
}

async function saveProgress(userId, data, step) {
  await supabase.from("user_progress").upsert(
    { user_id: userId, data, step, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

async function loadProgress(userId) {
  const { data } = await supabase
    .from("user_progress")
    .select("data, step")
    .eq("user_id", userId)
    .single();
  return data;
}

function MainApp({ session }) {
  const [step, setStep]       = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [data, setData]       = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const { programs } = usePrograms(data.locationInfo, data);

  useEffect(() => {
    (async () => {
      const saved = await loadProgress(session.user.id);
      if (saved?.data) { setData(saved.data); setStep(saved.step || 1); setMaxStep(saved.step || 1); }
      setLoading(false);
    })();
  }, []);

  const goTo = async (s) => {
    setStep(s);
    if (s > maxStep) setMaxStep(s);
    await saveProgress(session.user.id, data, s);
  };

  const updateData = async (newData) => {
    setData(newData);
    await saveProgress(session.user.id, newData, step);
  };

  const currentStep = STEPS[step - 1];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("./assets/logo.png")} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Bread Crumbs</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerStep}>Step {step} of {STEPS.length}</Text>
          <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step progress bar */}
      <StepBar step={step} maxStep={maxStep} onGoTo={goTo} />

      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>{currentStep.icon} {currentStep.title}</Text>
      </View>

      {step === 1 && (
        <LocationScreen data={data} setData={updateData} onNext={() => goTo(2)} programs={programs} />
      )}
      {step === 2 && (
        <IncomeScreen data={data} setData={updateData} onNext={() => goTo(3)} onBack={() => goTo(1)} />
      )}
      {step === 3 && (
        <HomeScreen data={data} setData={updateData} onNext={() => goTo(4)} onBack={() => goTo(2)} />
      )}
      {step > 3 && (
        <View style={styles.center}>
          <Text style={styles.soon}>Step {step} — {currentStep.title} 🚧</Text>
          <TouchableOpacity onPress={() => goTo(step - 1)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function RootNavigator() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  return session ? <MainApp session={session} /> : <AuthScreen />;
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={RootNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.white },
  loadingText: { marginTop: 12, color: C.gray500, fontWeight: "600" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.white,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { width: 54, height: 54, resizeMode: "contain" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.green, letterSpacing: -0.3 },
  headerRight: { alignItems: "flex-end", gap: 2 },
  headerStep: { fontSize: 11, fontWeight: "600", color: C.gray500 },
  signOutBtn: { paddingVertical: 2 },
  signOutText: { fontSize: 11, color: C.gray500, textDecorationLine: "underline" },
  stepBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100,
  },
  stepCell: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepDotDone:     { backgroundColor: C.green },
  stepDotCurrent:  { backgroundColor: C.green, shadowColor: C.green, shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  stepDotUnlocked: { backgroundColor: C.white, borderWidth: 2, borderColor: C.green },
  stepDotLocked:   { backgroundColor: C.gray100 },
  stepIcon: { fontSize: 11, color: C.gray500 },
  stepLine: { flex: 1, height: 2, backgroundColor: C.gray100, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: C.green },
  pageTitleRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: "#F5F5F0" },
  pageTitle: { fontSize: 22, fontWeight: "900", color: C.charcoal, letterSpacing: -0.4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F0" },
  soon: { fontSize: 16, fontWeight: "700", color: C.gray700, marginBottom: 20 },
  backBtn: { backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  backBtnText: { color: C.white, fontWeight: "700" },
});
