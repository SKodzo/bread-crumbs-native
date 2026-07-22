import { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, Image, TouchableOpacity, ActivityIndicator, useColorScheme, Modal, ScrollView, Alert, Animated, TextInput, KeyboardAvoidingView, Platform, AccessibilityInfo } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ThemeProvider, useThemeColors, useThemeMode } from "./src/lib/theme";
import { useTaxConfig } from "./src/lib/useTaxConfig";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { usePrograms } from "./src/lib/usePrograms";
import { useRates } from "./src/lib/useRates";
import { useHUD } from "./src/lib/useHUD";
import * as Sentry from "@sentry/react-native";
import { supabase } from "./src/lib/supabase";
import ErrorBoundary from "./src/components/ErrorBoundary";
import FeedbackModal from "./src/components/FeedbackModal";
import AuthScreen from "./src/screens/AuthScreen";
import LocationScreen from "./src/screens/LocationScreen";
import IncomeScreen from "./src/screens/IncomeScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoanScreen from "./src/screens/LoanScreen";
import ProgramsScreen from "./src/screens/ProgramsScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import RatiosScreen from "./src/screens/RatiosScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import ActionPlanScreen from "./src/screens/ActionPlanScreen";
import LandingScreen from "./src/screens/LandingScreen";
import RentApp from "./src/screens/rent/RentApp";
import SellerApp from "./src/screens/sell/SellerApp";

const Stack = createNativeStackNavigator();

// Accessibility — Dynamic Type. Text already scales with the iOS "Larger Text"
// setting by default; this caps the multiplier at 2x app-wide so the tightest
// layouts (step bar, number grid, header) can't break at the most extreme
// accessibility sizes, while body content still scales generously. A few
// fixed-size chrome elements set their own tighter cap inline.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = 2.0;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = 2.0;

// Crash & error reporting. Paste your DSN from sentry.io → Project Settings →
// Client Keys (DSN). Until then this is a safe no-op (nothing is sent).
const SENTRY_DSN = "https://ef0c60a3bf4353cc2977110e4f9f5727@o4511600428908544.ingest.us.sentry.io/4511600451780608";

if (SENTRY_DSN && !SENTRY_DSN.startsWith("YOUR_")) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Send a fraction of performance traces. Crash reports are always sent in full.
    tracesSampleRate: 0.2,
    // Don't report noisy errors while developing on your own machine.
    enabled: !__DEV__,
  });
}

export const STEPS = [
  { id:1, label:"Location",    icon:"📍", title:"Where are you buying?"        },
  { id:2, label:"Income",      icon:"💰", title:"Your income & savings"         },
  { id:3, label:"Budget",      icon:"📊", title:"Monthly spending"              },
  { id:4, label:"Home",        icon:"🏠", title:"Your target home"              },
  { id:5, label:"Loan",        icon:"🏦", title:"Choose your loan"              },
  { id:6, label:"Programs",    icon:"🎯", title:"Available programs"            },
  { id:7, label:"Ratios",      icon:"📐", title:"Underwriting ratios"           },
  { id:8, label:"Results",     icon:"✨", title:"Your full picture"             },
  { id:9, label:"Action Plan", icon:"✅", title:"Your personalized action plan" },
];

const INITIAL_DATA = {
  zip: "", locationInfo: null, isFirstTime: undefined,
  householdSize: 1, isRenting: undefined, monthlyRent: 1500,
  income: 86000, alimony: 0, k401: 3000, roth: 1000, hsa: 0,
  filingStatus: "single",
  profession: "none", isVet: false,
  score: 740, dpPct: 5, debts: 300,
  price: 340000, loanType: "fha", loanTerm: 360,
  programs: [], student: 0,
  groc: 400, dining: 200, ent: 150, pcare: 150, car: 500, efund: 300,
  childcare: 0, healthcare: 0, education: 0, misc: 0,
  savings: 0, investAcct: 0, rothBalance: 0, retirementBalance: 0,
  currentHomeValue: 0, currentMortgageBalance: 0, currentMortgagePayment: 0,
  sellFirst: undefined,
};

export const RENTER_INITIAL = {
  zip: "", locationInfo: null, rentalType: "apartment",
  roommates: 0, income: 65000, filingStatus: "single", score: 700,
  groc: 400, dining: 200, ent: 150, pcare: 150, car: 500, efund: 300,
  childcare: 0, healthcare: 0, education: 0, misc: 0,
  debts: 300, student: 0, currentSavings: 0, monthlySavingsContribution: 300,
  targetRent: 0,
};

export const SELLER_INITIAL = {
  zip: "", locationInfo: null, homeValue: 385000, mortgageBalance: 245000,
  income: 86000, filingStatus: "single", yearsOwned: 5,
  propertyType: "primary", commissionType: "traditional", commissionPct: 5.5,
  repairs: 3000, staging: 1500, photography: 500,
  originalPrice: 280000, improvements: 15000,
  listTimeline: "asap", afterSale: undefined,
};

function StepBar({ step, maxStep, onGoTo }) {
  const C = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.header, borderBottomWidth: 1, borderBottomColor: C.border }}>
      {STEPS.map((s, i) => (
        <View key={s.id} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            disabled={s.id > maxStep}
            onPress={() => s.id <= maxStep && onGoTo(s.id)}
            accessibilityLabel={`Step ${s.id}: ${s.label}${s.id === step ? ", current step" : s.id < step ? ", completed" : ", not yet available"}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: s.id > maxStep, selected: s.id === step }}
            style={[
              { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
              s.id < step   && { backgroundColor: C.green },
              s.id === step && { backgroundColor: C.green },
              s.id > step && s.id <= maxStep && { backgroundColor: C.card, borderWidth: 2, borderColor: C.green },
              s.id > maxStep && { backgroundColor: C.gray100 },
            ]}
          >
            <Text maxFontSizeMultiplier={1.4} style={[{ fontSize: 11, color: C.gray500 }, s.id <= step && { color: C.white }]}>
              {s.icon}
            </Text>
          </TouchableOpacity>
          {i < STEPS.length - 1 && (
            <View style={[{ flex: 1, height: 2, backgroundColor: C.gray100, marginHorizontal: 2 }, s.id < step && { backgroundColor: C.green }]} />
          )}
        </View>
      ))}
    </View>
  );
}

function DisclaimerModal({ visible, onAccept }) {
  const C = useThemeColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ backgroundColor: C.green, paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: C.white }}>Before you begin</Text>
          <Text style={{ fontSize: 13, color: C.greenLight, marginTop: 4 }}>Please read and acknowledge</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {[
            { title: "Not financial advice", body: "Bread Crumbs is an educational planning tool only. Nothing in this app constitutes financial, legal, mortgage, or investment advice. Always consult a licensed professional before making any financial decision." },
            { title: "Estimates only", body: "All calculations — mortgage payments, tax estimates, insurance rates, DTI ratios, and program eligibility — are approximations based on publicly available data and your inputs. Actual lender results will vary." },
            { title: "Program availability", body: "Down payment assistance programs change frequently. Funding runs out, income limits shift, and eligibility rules are updated. Always confirm program details directly with the administering agency or a participating lender before relying on them." },
            { title: "Your data", body: "Your financial inputs are stored securely in your personal account and are not shared with third parties or used for advertising. See our Privacy Policy for full details." },
          ].map(item => (
            <View key={item.title} style={{ marginBottom: 20, backgroundColor: C.card, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal, marginBottom: 6 }}>⚠️ {item.title}</Text>
              <Text style={{ fontSize: 13, color: C.gray700, lineHeight: 20 }}>{item.body}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={onAccept}
            style={{ backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            activeOpacity={0.8}
            accessibilityLabel="I understand, let's get started"
            accessibilityRole="button"
          >
            <Text style={{ color: C.white, fontSize: 16, fontWeight: "800" }}>I understand — Let's get started →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

let lastSaveOk = true;
async function saveProgress(userId, data, step) {
  try {
    const { error } = await supabase.from("user_progress").upsert(
      { user_id: userId, data, step, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    if (!lastSaveOk) { lastSaveOk = true; }
  } catch (_) {
    if (lastSaveOk) {
      lastSaveOk = false;
      Alert.alert("Couldn't save", "Your progress couldn't be saved right now. Check your connection — we'll keep trying.");
    }
  }
}

async function loadProgress(userId) {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("data, step")
      .eq("user_id", userId)
      .single();
    if (error) return null;
    return data;
  } catch (_) { return null; }
}

function DeleteConfirmModal({ visible, onCancel, onConfirm }) {
  const C = useThemeColors();
  const [typed, setTyped] = useState("");

  useEffect(() => { if (!visible) setTyped(""); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: C.text, marginBottom: 8 }}>Delete your account?</Text>
            <Text style={{ fontSize: 14, color: C.gray500, lineHeight: 20, marginBottom: 20 }}>
              This will permanently delete your account and all saved financial data. This action cannot be undone.
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 8 }}>
              Type <Text style={{ color: "#DC2626", fontWeight: "900" }}>DELETE</Text> to confirm
            </Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              placeholder="Type DELETE here"
              placeholderTextColor={C.gray500}
              autoCapitalize="characters"
              style={{
                borderWidth: 1.5,
                borderColor: typed === "DELETE" ? "#DC2626" : C.gray300,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                fontWeight: "700",
                color: C.text,
                marginBottom: 20,
                backgroundColor: C.bg,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={onCancel} style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => typed === "DELETE" && onConfirm()}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: typed === "DELETE" ? "#DC2626" : C.gray200 }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: typed === "DELETE" ? "#fff" : C.gray400 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HamburgerMenu({ onSignOut, onDeleteAccount, onSendFeedback, onSwitchMode }) {
  const C = useThemeColors();
  const { mode, setMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slideAnim = useRef(new Animated.Value(280)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const openMenu = () => {
    setOpen(true);
    if (reduceMotion) {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  };

  const closeMenu = (cb) => {
    if (reduceMotion) {
      slideAnim.setValue(280);
      fadeAnim.setValue(0);
      setOpen(false);
      cb && cb();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 280, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 220, useNativeDriver: true }),
      ]).start(() => { setOpen(false); cb && cb(); });
    }
  };

  return (
    <>
      <TouchableOpacity onPress={openMenu} style={{ padding: 8 }} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Open account menu" accessibilityRole="button">
        <View style={{ gap: 5 }}>
          <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
          <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
          <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
        </View>
      </TouchableOpacity>

      {open && (
        <Modal visible transparent animationType="none" onRequestClose={() => closeMenu()}>
          {/* Backdrop */}
          <Animated.View
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: fadeAnim }}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={() => closeMenu()} activeOpacity={1} />
          </Animated.View>

          {/* Drawer */}
          <Animated.View style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 280,
            backgroundColor: C.card,
            shadowColor: "#000", shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.18, shadowRadius: 16,
            elevation: 20,
            transform: [{ translateX: slideAnim }],
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Drawer header */}
              <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: C.text }}>Account</Text>
                <TouchableOpacity onPress={() => closeMenu()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close menu" accessibilityRole="button">
                  <Text style={{ fontSize: 22, color: C.gray400, fontWeight: "300" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
                {/* Sign Out — near top */}
                <TouchableOpacity
                  onPress={() => closeMenu(onSignOut)}
                  style={{ borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 12 }}
                  activeOpacity={0.8}
                  accessibilityLabel="Sign out. Your progress is saved."
                  accessibilityRole="button"
                >
                  <Text style={{ fontSize: 20 }}>🚪</Text>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>Sign Out</Text>
                    <Text style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>Your progress is saved</Text>
                  </View>
                </TouchableOpacity>

                {/* Switch flow */}
                {onSwitchMode && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: C.gray500, marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 }}>SWITCH PLANNER</Text>
                    <TouchableOpacity onPress={() => closeMenu(() => onSwitchMode("buying"))} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }} activeOpacity={0.8}>
                      <Text style={{ fontSize: 18 }}>🔑</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Home buying planner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => closeMenu(() => onSwitchMode("renting"))} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }} activeOpacity={0.8}>
                      <Text style={{ fontSize: 18 }}>🏢</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Rent planner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => closeMenu(() => onSwitchMode("selling"))} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10 }} activeOpacity={0.8}>
                      <Text style={{ fontSize: 18 }}>💰</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Seller planner</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Appearance — Light / Dark / Auto */}
                <View style={{ marginTop: 28 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.gray500, marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 }}>APPEARANCE</Text>
                  <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 12, padding: 4, gap: 4 }}>
                    {[{ k: "light", label: "Light", icon: "☀️" }, { k: "dark", label: "Dark", icon: "🌙" }, { k: "system", label: "Auto", icon: "⚙️" }].map(opt => {
                      const active = mode === opt.k;
                      return (
                        <TouchableOpacity
                          key={opt.k}
                          onPress={() => setMode(opt.k)}
                          style={[
                            { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
                            active && { backgroundColor: C.green },
                          ]}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`${opt.label} appearance${active ? ", selected" : ""}`}
                        >
                          <Text style={{ fontSize: 17, marginBottom: 3 }}>{opt.icon}</Text>
                          <Text style={{ fontSize: 12, fontWeight: active ? "800" : "600", color: active ? C.white : C.gray700 }}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Delete Account — pinned to bottom, far from Sign Out */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
                <View style={{ height: 1, backgroundColor: C.border, marginBottom: 20 }} />
                <TouchableOpacity
                  onPress={() => closeMenu(onSendFeedback)}
                  style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}
                  activeOpacity={0.8}
                  accessibilityLabel="Send feedback or report a bug"
                  accessibilityRole="button"
                >
                  <Text style={{ fontSize: 18 }}>💬</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Send feedback</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => closeMenu(onDeleteAccount)}
                  style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", flexDirection: "row", alignItems: "center", gap: 10 }}
                  activeOpacity={0.8}
                  accessibilityLabel="Delete account. Permanently removes all data."
                  accessibilityRole="button"
                >
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#DC2626" }}>Delete account</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

function MainApp({ session, onSwitchMode, sharedProfile, onUpdateSharedProfile }) {
  const C = useThemeColors();
  const [step, setStep]           = useState(1);
  const [maxStep, setMaxStep]     = useState(1);
  const [data, setData]           = useState(INITIAL_DATA);
  const [loading, setLoading]     = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { programs } = usePrograms(data.locationInfo, data);
  const { rates } = useRates();
  const { hud } = useHUD(data.locationInfo);

  useEffect(() => {
    (async () => {
      const [saved, seen] = await Promise.all([
        loadProgress(session.user.id),
        SecureStore.getItemAsync("disclaimer_accepted"),
      ]);
      if (saved?.data) {
        const merged = { ...saved.data, income: saved.data.income || sharedProfile.income, filingStatus: saved.data.filingStatus || sharedProfile.filingStatus, score: saved.data.score || sharedProfile.score };
        setData(merged);
        setStep(saved.step || 1);
        setMaxStep(saved.step || 1);
      } else {
        setData(prev => ({ ...prev, income: sharedProfile.income, filingStatus: sharedProfile.filingStatus, score: sharedProfile.score }));
      }
      if (!seen) setShowDisclaimer(true);
      setLoading(false);
    })();
  }, []);

  const acceptDisclaimer = async () => {
    await SecureStore.setItemAsync("disclaimer_accepted", "1");
    setShowDisclaimer(false);
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.from("user_progress").delete().eq("user_id", session.user.id);
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (_) {
      Alert.alert("Deletion failed", "We couldn't delete your account. Please check your connection and try again.");
    }
  };

  const goTo = async (s) => {
    setStep(s);
    if (s > maxStep) setMaxStep(s);
    await saveProgress(session.user.id, data, s);
  };

  const updateData = async (newData) => {
    setData(newData);
    if (newData.income !== data.income || newData.filingStatus !== data.filingStatus || newData.score !== data.score) {
      onUpdateSharedProfile({ income: newData.income, filingStatus: newData.filingStatus, score: newData.score });
    }
    await saveProgress(session.user.id, newData, step);
  };

  const currentStep = STEPS[step - 1];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={{ marginTop: 12, color: C.gray500, fontWeight: "600" }}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.header }}>
      <DisclaimerModal visible={showDisclaimer} onAccept={acceptDisclaimer} />
      <DeleteConfirmModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => { setShowDeleteModal(false); handleDeleteAccount(); }}
      />
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        session={session}
        step={step}
      />
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.header }}>
        <TouchableOpacity onPress={() => onSwitchMode(null)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} activeOpacity={0.7}>
          <Image source={require("./assets/logo.png")} style={{ width: 54, height: 54, resizeMode: "contain" }} />
          <Text style={{ fontSize: 18, fontWeight: "900", color: C.green, letterSpacing: -0.3 }}>Bread Crumbs</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.gray500 }}>Step {step} of {STEPS.length}</Text>
          <HamburgerMenu
            onSignOut={() => supabase.auth.signOut()}
            onDeleteAccount={() => setShowDeleteModal(true)}
            onSendFeedback={() => setShowFeedbackModal(true)}
            onSwitchMode={onSwitchMode}
          />
        </View>
      </View>

      <StepBar step={step} maxStep={maxStep} onGoTo={goTo} />

      {/* Page title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: C.bg }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.4 }}>{currentStep.icon} {currentStep.title}</Text>
      </View>

      {step === 1 && (
        <LocationScreen data={data} setData={updateData} onNext={() => goTo(2)} programs={programs} />
      )}
      {step === 2 && (
        <IncomeScreen data={data} setData={updateData} onNext={() => goTo(3)} onBack={() => goTo(1)} />
      )}
      {step === 3 && (
        <BudgetScreen data={data} setData={updateData} onNext={() => goTo(4)} onBack={() => goTo(2)} />
      )}
      {step === 4 && (
        <HomeScreen data={data} setData={updateData} onNext={() => goTo(5)} onBack={() => goTo(3)} />
      )}
      {step === 5 && (
        <LoanScreen data={data} setData={updateData} onNext={() => goTo(6)} onBack={() => goTo(4)} hud={hud} rates={rates} />
      )}
      {step === 6 && (
        <ProgramsScreen data={data} setData={updateData} onNext={() => goTo(7)} onBack={() => goTo(5)} programs={programs} hud={hud} />
      )}
      {step === 7 && (
        <RatiosScreen data={data} onNext={() => goTo(8)} onBack={() => goTo(6)} programs={programs} rates={rates} />
      )}
      {step === 8 && (
        <ResultsScreen data={data} onBack={() => goTo(7)} onNext={() => goTo(9)} programs={programs} rates={rates} />
      )}
      {step === 9 && (
        <ActionPlanScreen data={data} onBack={() => goTo(8)} />
      )}
    </SafeAreaView>
  );
}

function RootNavigator() {
  useTaxConfig();
  const C = useThemeColors();
  const [session, setSession] = useState(undefined);
  const [mode, setMode] = useState(null);
  const [sharedProfile, setSharedProfile] = useState({ income: 86000, filingStatus: "single", score: 740, currentLoanRate: null, savings: 0 });

  const updateSharedProfile = (updates) => {
    setSharedProfile(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const applySession = (s) => {
      setSession(s ?? null);
      Sentry.setUser(s?.user ? { id: s.user.id } : null);
    };
    supabase.auth.getSession().then(({ data: { session: s } }) => applySession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => applySession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  if (!session) return <AuthScreen />;
  if (!mode) return <LandingScreen onSelect={setMode} session={session} sharedProfile={sharedProfile} onUpdateSharedProfile={updateSharedProfile} />;
  if (mode === "buying") return <MainApp session={session} onSwitchMode={setMode} sharedProfile={sharedProfile} onUpdateSharedProfile={updateSharedProfile} />;
  if (mode === "renting") return <RentApp session={session} onSwitchMode={setMode} sharedProfile={sharedProfile} onUpdateSharedProfile={updateSharedProfile} />;
  if (mode === "selling") return <SellerApp session={session} onSwitchMode={setMode} sharedProfile={sharedProfile} onUpdateSharedProfile={updateSharedProfile} />;
  return <LandingScreen onSelect={setMode} session={session} />;
}

// Status bar text follows the active theme (light text on dark backgrounds).
function ThemedStatusBar() {
  const { resolved } = useThemeMode();
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} />;
}

function App() {
  // Hold the first paint until the saved theme choice has loaded, so a dark-mode
  // user never sees a flash of light. The brand-green holder matches the splash.
  const [themeReady, setThemeReady] = useState(false);
  return (
    <ErrorBoundary>
      <ThemeProvider onHydrated={() => setThemeReady(true)}>
        {themeReady ? (
          <NavigationContainer>
            <ThemedStatusBar />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Root" component={RootNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <View style={{ flex: 1, backgroundColor: "#1B6B44" }} />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(App);
