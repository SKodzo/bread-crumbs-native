import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useThemeColors } from "../lib/theme";

export default function DeleteConfirmModal({ visible, onCancel, onConfirm }) {
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
                borderRadius: 12, padding: 14, fontSize: 16, fontWeight: "700",
                color: C.text, marginBottom: 20, backgroundColor: C.bg,
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
