import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { supabase } from "../lib/supabase";
import { C } from "../lib/colors";

export default function AuthScreen() {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  const handleAuth = async () => {
    setError(""); setInfo("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    if (mode === "login") {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    } else {
      const { data, error: e } = await supabase.auth.signUp({
        email, password,
        options: { data: { phone: phone || null } },
      });
      if (e) setError(e.message);
      else setInfo("Check your email to confirm your account, then log in.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Logo / header */}
        <View style={s.header}>
          <Image source={require("../../assets/logo.png")} style={s.logo} />
          <Text style={s.title}>Bread Crumbs</Text>
          <Text style={s.subtitle}>Your homebuying roadmap</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Tab toggle */}
          <View style={s.tabs}>
            {["login", "signup"].map(t => (
              <TouchableOpacity key={t} onPress={() => { setMode(t); setError(""); setInfo(""); }} style={[s.tab, mode === t && s.tabActive]}>
                <Text style={[s.tabText, mode === t && s.tabTextActive]}>{t === "login" ? "Log In" : "Sign Up"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={C.gray300}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={s.fieldLabel}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={C.gray300}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {mode === "signup" && (
            <>
              <Text style={s.fieldLabel}>Phone number <Text style={s.optional}>(optional)</Text></Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 832-555-1234"
                placeholderTextColor={C.gray300}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}
          {info  ? <Text style={s.info}>{info}</Text>  : null}

          <TouchableOpacity onPress={handleAuth} style={s.btn} activeOpacity={0.8} disabled={loading}>
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={s.btnText}>{mode === "login" ? "Log In →" : "Create Account →"}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}>
            <Text style={s.switchText}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={s.disclaimer}>Your progress saves automatically after each step.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.green },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 0, paddingBottom: 0 },
  header: { alignItems: "center", marginBottom: 4 },
  logo: { width: 340, height: 260, resizeMode: "contain", marginTop: -20, marginBottom: -10 },
  title: { fontSize: 28, fontWeight: "900", color: C.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: C.greenLight, marginTop: 4, fontWeight: "500" },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  tabs: { flexDirection: "row", backgroundColor: C.gray100, borderRadius: 10, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 14, fontWeight: "600", color: C.gray500 },
  tabTextActive: { color: C.charcoal, fontWeight: "800" },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.charcoal, marginBottom: 6 },
  optional: { fontSize: 11, fontWeight: "500", color: C.gray500 },
  input: { borderWidth: 1.5, borderColor: C.gray300, borderRadius: 10, padding: 13, fontSize: 15, color: C.charcoal, marginBottom: 14 },
  error: { fontSize: 12, color: C.red, marginBottom: 10, fontWeight: "600" },
  info: { fontSize: 12, color: C.green, marginBottom: 10, fontWeight: "600" },
  btn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 16, marginTop: 4 },
  btnText: { color: C.white, fontSize: 16, fontWeight: "800" },
  switchText: { textAlign: "center", fontSize: 13, color: C.gray500, fontWeight: "500" },
  disclaimer: { textAlign: "center", color: C.greenLight, fontSize: 12, marginTop: 24, fontWeight: "500" },
});
