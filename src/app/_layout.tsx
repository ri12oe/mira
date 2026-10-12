import {
  BricolageGrotesque_200ExtraLight,
  BricolageGrotesque_300Light,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from "@expo-google-fonts/figtree";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { AuthProvider, useAuth } from "@/context/auth";
import { CaregiverSetupProvider, useCaregiverSetup } from "@/context/caregiver-setup";

// Keep the splash screen up until the fonts, the saved sign-in and the caregiver's data are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [FontFamily.extraLight]: BricolageGrotesque_200ExtraLight,
    [FontFamily.light]: BricolageGrotesque_300Light,
    [FontFamily.regular]: BricolageGrotesque_400Regular,
    [FontFamily.medium]: BricolageGrotesque_500Medium,
    [FontFamily.semiBold]: BricolageGrotesque_600SemiBold,
    [FontFamily.bold]: BricolageGrotesque_700Bold,
    [FontFamily.extraBold]: BricolageGrotesque_800ExtraBold,

    [FigtreeFont.regular]: Figtree_400Regular,
    [FigtreeFont.medium]: Figtree_500Medium,
    [FigtreeFont.semiBold]: Figtree_600SemiBold,
    [FigtreeFont.bold]: Figtree_700Bold,
    [FigtreeFont.extraBold]: Figtree_800ExtraBold,
  });

  return (
    <AuthProvider>
      <CaregiverSetupProvider>
        <RootStack fontsReady={loaded || !!error} />
      </CaregiverSetupProvider>
    </AuthProvider>
  );
}

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { session, isLoading } = useAuth();
  const { syncStatus } = useCaregiverSetup();
  const ready = fontsReady && !isLoading;
  const signedIn = !!session;
  // The splash covers the screens until the data is in, so Home never shows
  // blank names. Screens stay mounted underneath, so loading mid-setup doesn't reset them.
  const dataSettled = syncStatus !== "loading";

  useEffect(() => {
    if (ready && dataSettled) SplashScreen.hideAsync();
  }, [ready, dataSettled]);

  if (!ready) return null;

  // Screens not listed here (setup, sign-in code, help) are open to everyone
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Signed in only. Listed first: a signed-in launch lands on caregiverHome */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="caregiverHome" />
        <Stack.Screen name="caregiverHomeNotCheckIn" />
        <Stack.Screen name="caregiverHistory" />
        <Stack.Screen name="caregiverPeople" />
        <Stack.Screen name="caregiverSetting" />
        <Stack.Screen name="caregiverProfile" />
        <Stack.Screen name="checkInNow" />
        <Stack.Screen name="waiting" />
        <Stack.Screen name="connected" />
        <Stack.Screen name="connected2" />
      </Stack.Protected>
      {/* Signed out only: Welcome and the phone screen */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signIn" />
      </Stack.Protected>
    </Stack>
  );
}
