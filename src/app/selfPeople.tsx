import { SelfTabBar } from "@/components/caregiver-tab-bar";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKGROUND = "#F5F4FA";

export default function SelfPeople() {
  return (
    <SafeAreaView style={styles.container}>
      <SelfTabBar active="people" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: BACKGROUND,
  },
});
