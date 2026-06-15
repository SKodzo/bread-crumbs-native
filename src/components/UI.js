import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../lib/colors";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SecTitle({ children }) {
  return <Text style={styles.secTitle}>{children}</Text>;
}

export function Alert({ type = "info", children }) {
  const colors = {
    info:    { bg: C.blueLight,  border: C.blue,  text: C.blue },
    warning: { bg: C.amberLight, border: C.amber, text: C.amber },
    danger:  { bg: C.redLight,   border: C.red,   text: C.red },
  };
  const col = colors[type] || colors.info;
  return (
    <View style={[styles.alert, { backgroundColor: col.bg, borderColor: col.border }]}>
      <Text style={[styles.alertText, { color: col.text }]}>{children}</Text>
    </View>
  );
}

export function BtnPri({ onPress, disabled, children }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnPri, disabled && styles.btnPriDisabled]}
      activeOpacity={0.8}
    >
      <Text style={styles.btnPriText}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  secTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.charcoal,
    marginBottom: 12,
  },
  alert: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  btnPri: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  btnPriDisabled: {
    backgroundColor: C.gray300,
  },
  btnPriText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
