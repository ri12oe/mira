import {
  BricolageGrotesque_200ExtraLight,
  BricolageGrotesque_300Light,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { FontFamily } from '@/constants/fonts';

// Keep the splash screen up until the fonts are ready
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
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}