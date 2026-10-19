import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const BACKGROUND = "#F5F4FA";

// Placeholder for the next step of the "for myself" setup
export default function SelfSetup4() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <AppText style={styles.title}>Coming soon</AppText>
      <AppText style={styles.subtitle}>This step isn&apos;t built yet.</AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: BACKGROUND,
  },
  header: {
    marginTop: 36,
    alignItems: "flex-start",
  },
  title: {
    marginTop: 24,
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
  },
});
