import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, Linking,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";

export default function AuthScreen() {
  const C = useTheme();
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [agreed, setAgreed]     = useState(false);

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email above, then tap Forgot password."); return; }
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (e) setError(e.message);
    else setInfo("Password reset link sent — check your email.");
  };

  const handleAuth = async () => {
    setError(""); setInfo("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (mode === "signup" && !agreed) { setError("Please agree to the Privacy Policy to create an account."); return; }
    setLoading(true);
    if (mode === "login") {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    } else {
      const { error: e } = await supabase.auth.signUp({
        email, password,
        options: { data: { phone: phone || null } },
      });
      if (e) setError(e.message);
      else setInfo("Check your email to confirm your account, then log in.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.green }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 0, paddingBottom: 0 }} keyboardShouldPersistTaps="handled">

        {/* Logo / header */}
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Image source={require("../../assets/logo.png")} style={{ width: 340, height: 260, resizeMode: "contain", marginTop: -20, marginBottom: -10 }} />
          <Text style={{ fontSize: 28, fontWeight: "900", color: C.white, letterSpacing: -0.5 }}>Bread Crumbs</Text>
          <Text style={{ fontSize: 14, color: C.greenLight, marginTop: 4, fontWeight: "500" }}>Your financial roadmap</Text>
        </View>

        {/* Card */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
          {/* Tab toggle */}
          <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 10, padding: 3, marginBottom: 20 }}>
            {["login", "signup"].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => { setMode(t); setError(""); setInfo(""); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === t }}
                accessibilityLabel={t === "login" ? "Log In tab" : "Sign Up tab"}
                style={[
                  { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
                  mode === t && { backgroundColor: C.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: mode === t ? "800" : "600", color: mode === t ? C.charcoal : C.gray500 }}>
                  {t === "login" ? "Log In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 6 }}>Email</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: C.gray300, borderRadius: 10, padding: 13, fontSize: 15, color: C.charcoal, marginBottom: 14 }}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={C.gray300}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: C.gray300, borderRadius: 10, padding: 13, fontSize: 15, color: C.charcoal, marginBottom: 14 }}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={C.gray300}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {mode === "signup" && (
            <>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 6 }}>
                Phone number <Text style={{ fontSize: 11, fontWeight: "500", color: C.gray500 }}>(optional)</Text>
              </Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: C.gray300, borderRadius: 10, padding: 13, fontSize: 15, color: C.charcoal, marginBottom: 14 }}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 832-555-1234"
                placeholderTextColor={C.gray300}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </>
          )}

          {mode === "signup" && (
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 }}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              accessibilityLabel="I agree to the Privacy Policy and understand that Bread Crumbs collects financial planning inputs to generate my personalized homebuying roadmap"
            >
              <View style={{
                width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                borderColor: agreed ? C.green : C.gray300,
                backgroundColor: agreed ? C.green : "transparent",
                alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0,
              }}>
                {agreed && <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 12, color: C.gray500, flex: 1, lineHeight: 18 }}>
                I agree to the{" "}
                <Text
                  style={{ color: C.green, fontWeight: "700", textDecorationLine: "underline" }}
                  onPress={() => Linking.openURL("https://bread-crumbs-one.vercel.app/privacy.html")}
                >
                  Privacy Policy
                </Text>
                . I understand that Bread Crumbs collects financial planning inputs to generate my personalized homebuying roadmap.
              </Text>
            </TouchableOpacity>
          )}

          {error ? <Text style={{ fontSize: 12, color: C.red, marginBottom: 10, fontWeight: "600" }}>{error}</Text> : null}
          {info  ? <Text style={{ fontSize: 12, color: C.green, marginBottom: 10, fontWeight: "600" }}>{info}</Text>  : null}

          <TouchableOpacity
            onPress={handleAuth}
            style={{ backgroundColor: mode === "signup" && !agreed ? C.gray300 : C.green, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 16, marginTop: 4 }}
            activeOpacity={0.8}
            disabled={loading || (mode === "signup" && !agreed)}
            accessibilityRole="button"
            accessibilityLabel={mode === "login" ? "Log in" : "Create account"}
            accessibilityState={{ disabled: loading || (mode === "signup" && !agreed) }}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={{ color: C.white, fontSize: 16, fontWeight: "800" }}>{mode === "login" ? "Log In →" : "Create Account →"}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }} accessibilityRole="button">
            <Text style={{ textAlign: "center", fontSize: 13, color: C.gray500, fontWeight: "500" }}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </Text>
          </TouchableOpacity>

          {mode === "login" && (
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 12 }} accessibilityRole="button" accessibilityLabel="Forgot password">
              <Text style={{ textAlign: "center", fontSize: 12, color: C.gray400 || C.gray500, fontWeight: "500" }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={{ textAlign: "center", color: C.greenLight, fontSize: 12, marginTop: 24, fontWeight: "500" }}>
          Your progress saves automatically after each step.
        </Text>

        <Text style={{ textAlign: "center", color: C.greenLight, fontSize: 11, marginTop: 10 }}>
          <Text accessibilityRole="link" accessibilityLabel="Privacy Policy" onPress={() => Linking.openURL("https://bread-crumbs-one.vercel.app/privacy.html")} style={{ textDecorationLine: "underline" }}>Privacy Policy</Text>
          <Text>{"   ·   "}</Text>
          <Text accessibilityRole="link" accessibilityLabel="Terms of Use" onPress={() => Linking.openURL("https://bread-crumbs-one.vercel.app/terms.html")} style={{ textDecorationLine: "underline" }}>Terms of Use</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
