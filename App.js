import { useState } from "react";
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { C } from "./src/lib/colors";
import { usePrograms } from "./src/lib/usePrograms";
import LocationScreen from "./src/screens/LocationScreen";

const Stack = createNativeStackNavigator();

export const STEPS = [
  { id:1, label:"Location",    icon:"📍", title:"Where are you buying?"       },
  { id:2, label:"Income",      icon:"💰", title:"Your income & savings"        },
  { id:3, label:"Home",        icon:"🏠", title:"Your target home"             },
  { id:4, label:"Loan",        icon:"🏦", title:"Choose your loan"             },
  { id:5, label:"Programs",    icon:"🎯", title:"Available programs"           },
  { id:6, label:"Budget",      icon:"📊", title:"Monthly spending"             },
  { id:7, label:"Ratios",      icon:"📐", title:"Underwriting ratios"          },
  { id:8, label:"Results",     icon:"✨", title:"Your full picture"            },
  { id:9, label:"Action Plan", icon:"✅", title:"Your personalized action plan"},
];

const INITIAL_DATA = {
  zip: "", locationInfo: null, isFirstTime: undefined,
  householdSize: 1, isRenting: undefined, monthlyRent: 1500,
  profession: "none", isVet: false, income: 0,
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
              s.id < step  && styles.stepDotDone,
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

function MainApp() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [data, setData] = useState(INITIAL_DATA);
  const { programs } = usePrograms(data.locationInfo, data);

  const goTo = (s) => {
    setStep(s);
    if (s > maxStep) setMaxStep(s);
  };

  const currentStep = STEPS[step - 1];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("./assets/logo.png")} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Bread Crumbs</Text>
        </View>
        <Text style={styles.headerStep}>Step {step} of {STEPS.length}</Text>
      </View>

      {/* Step progress bar */}
      <StepBar step={step} maxStep={maxStep} onGoTo={goTo} />

      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>{currentStep.icon} {currentStep.title}</Text>
      </View>

      {/* Screens */}
      {step === 1 && (
        <LocationScreen
          data={data} setData={setData}
          onNext={() => goTo(2)}
          programs={programs}
        />
      )}
      {step > 1 && (
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

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.white,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { width: 54, height: 54, resizeMode: "contain" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.green, letterSpacing: -0.3 },
  headerStep: { fontSize: 11, fontWeight: "600", color: C.gray500 },
  stepBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100,
  },
  stepCell: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
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
