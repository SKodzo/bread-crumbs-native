import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";
import { useThemeColors } from "../lib/theme";
import { supabase } from "../lib/supabase";

/**
 * In-app feedback / bug report. Opened from the hamburger menu.
 * Writes to the Supabase `feedback` table (the owned record) and also fires a
 * best-effort Sentry user-feedback event so bug reports land next to crashes.
 */
export default function FeedbackModal({ visible, onClose, session, step }) {
  const C = useThemeColors();
  const [category, setCategory] = useState("bug");
  const [message, setMessage]   = useState("");
  const [email, setEmail]       = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  // Fresh state each time the sheet opens; prefill the account email.
  useEffect(() => {
    if (visible) {
      setCategory("bug");
      setMessage("");
      setEmail(session?.user?.email || "");
      setSending(false);
      setSent(false);
      setError("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!message.trim()) { setError("Please enter a little detail first."); return; }
    setSending(true); setError("");

    const { error: e } = await supabase.from("feedback").insert({
      user_id:     session?.user?.id ?? null,
      category,
      message:     message.trim(),
      email:       email.trim() || null,
      app_version: Constants.expoConfig?.version ?? null,
      platform:    Platform.OS,
      os_version:  String(Platform.Version),
      step:        step ?? null,
    });

    if (e) {
      setSending(false);
      setError("Couldn't send right now — please try again.");
      return;
    }

    // Best-effort: surface it in Sentry too (no-op until the DSN is set).
    try {
      Sentry.captureFeedback({
        message: `[${category === "bug" ? "Bug" : "Idea"}] ${message.trim()}`,
        email: email.trim() || undefined,
      });
    } catch (_) {}

    setSending(false);
    setSent(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24 }}>
            {sent ? (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: C.text, marginBottom: 8, textAlign: "center" }}>Thank you!</Text>
                <Text style={{ fontSize: 14, color: C.gray500, lineHeight: 20, textAlign: "center", marginBottom: 22 }}>
                  Your {category === "bug" ? "bug report" : "idea"} helps make Bread Crumbs better for everyone.
                </Text>
                <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 }} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Close">
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: C.text }}>Send Feedback</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Close">
                    <Text style={{ fontSize: 22, color: C.gray400, fontWeight: "300" }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 13, color: C.gray500, lineHeight: 19, marginBottom: 18 }}>
                  Found a bug or have an idea? We read every message.
                </Text>

                {/* Category toggle */}
                <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 10, padding: 3, marginBottom: 18 }}>
                  {[{ k: "bug", label: "🐛 Bug" }, { k: "idea", label: "💡 Idea" }].map(opt => (
                    <TouchableOpacity
                      key={opt.k}
                      onPress={() => setCategory(opt.k)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: category === opt.k }}
                      style={[
                        { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
                        category === opt.k && { backgroundColor: C.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
                      ]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: category === opt.k ? "800" : "600", color: category === opt.k ? C.text : C.gray500 }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  {category === "bug" ? "What happened?" : "What's your idea?"}
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={category === "bug" ? "Describe the bug and what you were doing…" : "Tell us what would make Bread Crumbs better…"}
                  placeholderTextColor={C.gray500}
                  multiline
                  style={{ borderWidth: 1.5, borderColor: C.gray300, borderRadius: 12, padding: 13, fontSize: 15, color: C.text, minHeight: 110, textAlignVertical: "top", marginBottom: 14, backgroundColor: C.bg }}
                />

                <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  Email <Text style={{ fontWeight: "500", color: C.gray500 }}>(optional, if you'd like a reply)</Text>
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={C.gray500}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ borderWidth: 1.5, borderColor: C.gray300, borderRadius: 12, padding: 13, fontSize: 15, color: C.text, marginBottom: 14, backgroundColor: C.bg }}
                />

                {error ? <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600", marginBottom: 12 }}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={sending}
                  style={{ backgroundColor: C.green, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 4, opacity: sending ? 0.7 : 1 }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Send feedback"
                >
                  {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Send</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
