import { AppText } from "@/components/app-test";
import { Dot } from "@/components/dot";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import type { ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDER = "#E6E4EF";

/**
 * Shown instead of the app when a screen crashes (the root layout's
 * ErrorBoundary). Calm words, one big button, and the reassurance that
 * check-ins and alerts don't depend on this phone: they run on the server.
 */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const [retrying, setRetrying] = useState(false);

  // A crash before the app finished loading would leave the splash screen on
  // top of this one, so make sure it's gone
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const tryAgain = async () => {
    setRetrying(true);
    await retry();
    setRetrying(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Dot size={120} pose="wave" label={null} />
        <AppText style={styles.title} accessibilityRole="header">
          Something went wrong
        </AppText>
        <AppText style={styles.body}>
          Mira hit a problem on this screen. Nothing is lost: check-ins and alerts keep running on
          Mira&apos;s servers, even while this screen is having trouble.
        </AppText>

        <Pressable
          style={({ pressed }) => [styles.button, retrying && styles.busy, pressed && styles.pressed]}
          onPress={tryAgain}
          disabled={retrying}
          accessibilityRole="button"
          accessibilityHint="Opens the screen again"
          accessibilityState={{ busy: retrying, disabled: retrying }}
        >
          {retrying && <ActivityIndicator color="#fff" />}
          <AppText style={styles.buttonText}>Try again</AppText>
        </Pressable>

        {/* Only while developing: what actually broke, to help fix it */}
        {__DEV__ && (
          <View style={styles.details}>
            <AppText style={styles.detailsLabel}>For the developer</AppText>
            <AppText style={styles.detailsText} selectable>
              {error.message}
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.extraBold,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
  },
  body: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    height: 58,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  busy: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  details: {
    alignSelf: "stretch",
    marginTop: 8,
    padding: 14,
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  detailsLabel: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 14,
  },
  detailsText: {
    color: INK,
    fontFamily: FigtreeFont.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});