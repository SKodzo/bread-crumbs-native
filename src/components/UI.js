import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";

export function Card({ children, style }) {
  const C = useTheme();
  return (
    <View style={[{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }, style]}>
      {children}
    </View>
  );
}

export function SecTitle({ children }) {
  const C = useTheme();
  return (
    <Text style={{ fontSize: 11, fontWeight: "800", color: C.green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

export function Alert({ type = "info", children }) {
  const C = useTheme();
  const colors = {
    info:    { bg: C.blueLight,  border: C.blue,  text: C.blue },
    warning: { bg: C.amberLight, border: C.amber, text: C.amber },
    danger:  { bg: C.redLight,   border: C.red,   text: C.red },
    success: { bg: C.greenPale,  border: C.green, text: C.green },
  };
  const col = colors[type] || colors.info;
  return (
    <View style={{ borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8, backgroundColor: col.bg, borderColor: col.border }}>
      <Text style={{ fontSize: 12, lineHeight: 18, fontWeight: "500", color: col.text }}>{children}</Text>
    </View>
  );
}

export function SliderRow({ label, min, max, step, value, onChange, display, note, color }) {
  const C = useTheme();
  const trackColor = color || C.green;
  // Capture the value at first mount as the slider key. This forces the thumb
  // to re-anchor correctly when re-entering a screen after Supabase loads data,
  // without remounting the slider on every drag tick.
  const [mountKey] = useState(() => `${min}_${max}_${value}`);
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 18, fontWeight: "900", color: trackColor }}>{display}</Text>
      </View>
      <Slider
        key={mountKey}
        style={{ width: "100%", height: 36 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={C.gray300}
        thumbTintColor={trackColor}
        accessibilityLabel={label}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: display }}
      />
      {note ? <Text style={{ fontSize: 11, color: C.gray500, marginTop: -4 }}>{note}</Text> : null}
    </View>
  );
}

export function StepDots({ current, total, color, onPress }) {
  const C = useTheme();
  const accent = color || C.green;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10 }}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        const dot = (
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: done || active ? accent : C.gray100,
            alignItems: "center", justifyContent: "center",
          }}>
            {done ? (
              <Text style={{ color: C.white, fontSize: 12, fontWeight: "800" }}>✓</Text>
            ) : (
              <Text style={{ color: done || active ? C.white : C.gray500, fontSize: 10, fontWeight: "600" }}>{stepNum}</Text>
            )}
          </View>
        );
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {onPress ? (
              <TouchableOpacity onPress={() => onPress(stepNum)} activeOpacity={0.7}>{dot}</TouchableOpacity>
            ) : dot}
            {i < total - 1 && (
              <View style={{ width: 18, height: 2, backgroundColor: done ? accent : C.gray100 }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function NavButtons({ onBack, onNext, nextLabel, backLabel, accent, color }) {
  const C = useTheme();
  const bg = accent || color || C.green;
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 24 }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel || "Back"} style={{ flex: onNext ? 1 : 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>{backLabel || "← Back"}</Text>
        </TouchableOpacity>
      )}
      {onNext && (
        <TouchableOpacity onPress={onNext} accessibilityRole="button" accessibilityLabel={nextLabel || "Continue"} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: bg }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>{nextLabel || "Continue →"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function BtnPri({ onPress, disabled, children }) {
  const C = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: disabled ? C.gray300 : C.green, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4, marginBottom: 24 }}
      activeOpacity={0.8}
    >
      <Text style={{ color: C.white, fontSize: 16, fontWeight: "800" }}>{children}</Text>
    </TouchableOpacity>
  );
}
