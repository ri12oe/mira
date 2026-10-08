import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont } from "@/constants/fonts";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CaregiverClock() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText style={styles.title}>People</AppText>
      </View>
      <CaregiverTabBar active="clock" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F4FA",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: "#15163A",
    fontFamily: FigtreeFont.extraBold,
  },
});
