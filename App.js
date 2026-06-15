import { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { C } from "./src/lib/colors";
import { usePrograms } from "./src/lib/usePrograms";
import LocationScreen from "./src/screens/LocationScreen";

const Stack = createNativeStackNavigator();

const INITIAL_DATA = {
  zip: "",
  locationInfo: null,
  isFirstTime: undefined,
  householdSize: 1,
  isRenting: undefined,
  monthlyRent: 1500,
  profession: "none",
  isVet: false,
  income: 0,
};

function LocationWrapper({ navigation }) {
  const [data, setData] = useState(INITIAL_DATA);
  const { programs } = usePrograms(data.locationInfo, data);

  return (
    <LocationScreen
      data={data}
      setData={setData}
      onNext={() => navigation.navigate("ComingSoon")}
      programs={programs}
    />
  );
}

function ComingSoonScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.soon}>Step 2 coming soon 🚧</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍞 Bread Crumbs</Text>
          <Text style={styles.headerSub}>Your homebuying roadmap</Text>
        </View>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Location" component={LocationWrapper} />
          <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.green },
  header: {
    backgroundColor: C.green,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.white },
  headerSub: { fontSize: 12, color: C.greenLight, fontWeight: "500", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F0" },
  soon: { fontSize: 18, fontWeight: "700", color: C.gray700 },
});
