import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, SafeAreaView, AccessibilityInfo } from "react-native";
import { useThemeColors, useThemeMode } from "../lib/theme";
import { supabase } from "../lib/supabase";
import FeedbackModal from "./FeedbackModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function FlowMenu({ onSwitchMode, session, dotStyle }) {
  const C = useThemeColors();
  const { mode, setMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slideAnim = useRef(new Animated.Value(280)).current;

  const onSignOut = () => supabase.auth.signOut();
  const onSendFeedback = () => setShowFeedback(true);
  const onDeleteAccount = () => setShowDelete(true);

  const handleDelete = async () => {
    setShowDelete(false);
    try {
      if (session?.user?.id) {
        await supabase.from("user_progress").delete().eq("user_id", session.user.id);
        await supabase.rpc("delete_user");
      }
    } catch (_) {}
    await supabase.auth.signOut();
  };
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const openMenu = () => {
    setOpen(true);
    if (reduceMotion) { slideAnim.setValue(0); fadeAnim.setValue(1); }
    else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  };

  const closeMenu = (cb) => {
    if (reduceMotion) { slideAnim.setValue(280); fadeAnim.setValue(0); setOpen(false); cb && cb(); }
    else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 280, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => { setOpen(false); cb && cb(); });
    }
  };

  return (
    <>
      <TouchableOpacity onPress={openMenu} style={{ padding: 8 }} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {dotStyle ? (
          <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.6)" }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.6)" }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.6)" }} />
          </View>
        ) : (
          <View style={{ gap: 5 }}>
            <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
            <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
            <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: C.gray500 }} />
          </View>
        )}
      </TouchableOpacity>

      {open && (
        <Modal visible transparent animationType="none" onRequestClose={() => closeMenu()}>
          <Animated.View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: fadeAnim }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => closeMenu()} activeOpacity={1} />
          </Animated.View>

          <Animated.View style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 280,
            backgroundColor: C.card,
            shadowColor: "#000", shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 20,
            transform: [{ translateX: slideAnim }],
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: C.text }}>Menu</Text>
                <TouchableOpacity onPress={() => closeMenu()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 22, color: C.gray400, fontWeight: "300" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
                {/* Sign out */}
                <TouchableOpacity onPress={() => closeMenu(onSignOut)} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 18 }}>🚪</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Sign out</Text>
                  <Text style={{ marginLeft: "auto", fontSize: 11, color: C.gray500 }}>Saved</Text>
                </TouchableOpacity>

                {/* Switch planner — only shown when inside a flow, not on landing screen */}
                {onSwitchMode && (
                  <View style={{ marginTop: 16 }}>
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

                {/* Appearance */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.gray500, marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 }}>APPEARANCE</Text>
                  <View style={{ flexDirection: "row", backgroundColor: C.gray100, borderRadius: 12, padding: 4, gap: 4 }}>
                    {[{ k: "light", label: "Light", icon: "☀️" }, { k: "dark", label: "Dark", icon: "🌙" }, { k: "system", label: "Auto", icon: "⚙️" }].map(opt => {
                      const active = mode === opt.k;
                      return (
                        <TouchableOpacity
                          key={opt.k}
                          onPress={() => setMode(opt.k)}
                          style={[{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" }, active && { backgroundColor: C.green }]}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 15, marginBottom: 2 }}>{opt.icon}</Text>
                          <Text style={{ fontSize: 11, fontWeight: active ? "800" : "600", color: active ? C.white : C.gray700 }}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Bottom */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
                <View style={{ height: 1, backgroundColor: C.border, marginBottom: 16 }} />
                <TouchableOpacity onPress={() => closeMenu(onSendFeedback)} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 18 }}>💬</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Send feedback</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => closeMenu(onDeleteAccount)} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", flexDirection: "row", alignItems: "center", gap: 10 }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#DC2626" }}>Delete account</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} session={session} step={null} />
      <DeleteConfirmModal visible={showDelete} onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />
    </>
  );
}
