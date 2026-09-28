import { AppText } from "@/components/app-test";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { FontFamily, FigtreeFont } from "@/constants/fonts";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";


export default function whoUsesMira() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable 
          onPress={() => {() => router.back()}}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
          hitSlop={12}
          style={styles.backButton}
          >
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path
              d="M13.75 5.5L8.25 11L13.75 16.5"
              stroke="#15163A"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <View style={styles.callout}>
          <AppText style={styles.calloutHeader}>
            Who is using Mira?
          </AppText>
          <AppText style={styles.calloutBody}>
            Pick the one that fits. You can add more people later.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderColor: BORDERCOLOR,
    borderWidth: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 56,
  },
  callout: {
    marginTop: 32,
    gap: 10,
  },
  calloutHeader: {
    color: INK,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
    fontFamily: FontFamily.bold,
    alignSelf: "stretch",
  },
  calloutBody: {
    color: SUBTITLE,
    fontSize: 17,
    lineHeight: 24.65,
    fontFamily: FigtreeFont.medium,
    alignSelf: "stretch",
  },
}); 
