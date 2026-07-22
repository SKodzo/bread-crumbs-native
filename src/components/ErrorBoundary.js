import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as Sentry from "@sentry/react-native";

/**
 * Catches any render-time exception in the component tree below it and shows a
 * recoverable fallback screen instead of crashing to a blank white screen.
 *
 * Intentionally self-contained: it hardcodes brand colors and avoids hooks/context
 * so the fallback still renders even if theme or navigation state is what broke.
 *
 * Note: error boundaries catch errors during render, lifecycle, and constructors —
 * NOT inside event handlers or async code. Those are already guarded with try/catch
 * in the network hooks (useHUD / usePrograms / useRates) and PDF export.
 */
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Report the render crash to Sentry with the React component stack attached.
    Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    if (__DEV__) console.error("Caught by ErrorBoundary:", error, info);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: "#1B6B44", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 120, height: 90, resizeMode: "contain", marginBottom: 20 }}
        />
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 15, color: "#a8d5bc", textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
          The app hit an unexpected problem. Your saved progress is safe — tap below to continue.
        </Text>
        <TouchableOpacity
          onPress={this.handleReset}
          style={{ backgroundColor: "#fff", borderRadius: 14, paddingVertical: 15, paddingHorizontal: 36 }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={{ color: "#1B6B44", fontSize: 16, fontWeight: "800" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
