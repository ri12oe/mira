import { CornerClouds, useCornerCloudSize } from "@/components/conor_clouds";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/app-text";

//  New Colors to test out
const lightGreen = "#A8D130";
const darkBlue = "#1C2E9D";
const lightBlue = "#414DC7";
const lightPurple = "#B024F1";
const lighterBlue = "#349AD5";

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  const { height: cloudH } = useCornerCloudSize();
  return (
    <View style={styles.screen}>
      <CornerClouds />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(cloudH * 0.6, insets.top + 16),
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 23,
        }}
      >
        <View style={styles.header}>
            <AppText style={styles.headerText}>welcome to</AppText>
            <AppText style={styles.headerBrand}>Mira</AppText>
        </View>
        
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#FFF8FC",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    color: darkBlue,
    fontWeight: "500",
    
  },
  headerBrand: {
    fontSize: 120,
    color: "black",
    fontWeight: "800",
    lineHeight: 96,
    letterSpacing: 2,
  },
});
