import { AppText } from "@/components/app-text";
import { CornerClouds, useCornerCloudSize } from "@/components/conor_clouds";
import { WhiteArcSection } from "@/components/white_arc";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { ComponentProps, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
//  New Colors to test out
const lightGreen = "#A8D130";
const darkBlue = "#1C2E9D";
const lightBlue = "#414DC7";
const lightPurple = "#B024F1";
const lighterBlue = "#349AD5";
const WHITE = "#FFF";
const SUBTLE = "#4A5575";

// The smallest the layout is allowed to shrink (75% of the design size).
const MIN_FIT = 0.75;

type OptionCardProps = {
  icon: ComponentProps<typeof Feather>["name"];
  iconColor: string; // icon circle background
  title: string;
  subtitle: string;
  onPress: () => void;
  sz: (n: number) => number; // scales a design size to fit the screen
};

function OptionCard({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  sz,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.buttonOption,
        {
          gap: sz(16),
          minHeight: sz(96),
          paddingVertical: sz(16),
          paddingHorizontal: sz(18),
          borderRadius: sz(28),
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            width: sz(56),
            height: sz(56),
            borderRadius: sz(28),
            backgroundColor: iconColor,
          },
        ]}
      >
        <Feather name={icon} size={sz(26)} color={WHITE} />
      </View>

      <View style={[styles.buttonTextContainer, { gap: sz(4) }]}>
        <AppText
          maxFontSizeMultiplier={1.4}
          style={[styles.buttonTitle, { fontSize: sz(22) }]}
        >
          {title}
        </AppText>
        <AppText
          maxFontSizeMultiplier={1.4}
          style={[
            styles.buttonSubtitle,
            { fontSize: sz(16), lineHeight: sz(22) },
          ]}
        >
          {subtitle}
        </AppText>
      </View>

      <Entypo name="chevron-right" size={sz(26)} color={darkBlue} />
    </Pressable>
  );
}

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { height: cloudH } = useCornerCloudSize();

  // fit = how much to shrink everything so it fits on this screen.
  // Starts at full size; the layout measures itself and shrinks if needed.
  const [fit, setFit] = useState(1);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);

  // Start over at full size if the screen size changes.
  useEffect(() => setFit(1), [screenW, screenH]);

  // If the content is taller than the screen, shrink proportionally.
  useEffect(() => {
    if (!viewportH || !contentH) return;
    if (contentH > viewportH + 1 && fit > MIN_FIT) {
      setFit(Math.max(MIN_FIT, fit * (viewportH / contentH)));
    }
  }, [contentH, viewportH]);

  // Last resort (e.g. huge system text): allow scrolling so nothing is hidden.
  const mustScroll = fit <= MIN_FIT && contentH > viewportH + 1;

  const sz = (n: number) => Math.round(n * fit);
  const brandSize = sz(Math.min(120, screenH * 0.14));

  return (
    <View style={styles.screen}>
      <CornerClouds />

      <ScrollView
        scrollEnabled={mustScroll}
        bounces={false}
        showsVerticalScrollIndicator={mustScroll}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentH(h)}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Top part */}
        <View
          style={[
            styles.top,
            { paddingTop: Math.max(cloudH * 0.6 * fit, insets.top + 12) },
          ]}
        >
          <View style={[styles.header, { gap: sz(13), marginBottom: sz(16) }]}>
            <AppText
              maxFontSizeMultiplier={1}
              style={[styles.headerText, { fontSize: sz(24) }]}
            >
              welcome to
            </AppText>
            <AppText
              maxFontSizeMultiplier={1}
              style={[
                styles.headerBrand,
                { fontSize: brandSize, lineHeight: brandSize * 0.85, marginTop: -brandSize * 0.12, paddingTop: 4,},
              ]}
            >
              Mira
            </AppText>
          </View>
          <AppText
            maxFontSizeMultiplier={1.3}
            style={[
              styles.calloutText,
              { fontSize: sz(22), lineHeight: sz(28), padding: sz(16) },
            ]}
          >
            A short check-in each day so the people who care for you know
            you’re okay.
          </AppText>
        </View>

        {/* Bottom part: fills all remaining space to the bottom edge */}
        <WhiteArcSection
          style={{
            marginTop: sz(24),
            paddingTop: sz(50),
            paddingBottom: insets.bottom + sz(20),
            paddingHorizontal: 23,
          }}
        >
          <AppText
            maxFontSizeMultiplier={1.3}
            style={[
              styles.question,
              { fontSize: sz(32), lineHeight: sz(40), marginBottom: sz(20) },
            ]}
          >
            Who is using Mira?
          </AppText>
          <View style={[styles.buttonContainer, { gap: sz(18) }]}>
            <OptionCard
              sz={sz}
              icon="heart"
              iconColor={lightBlue}
              title="I'm a caregiver"
              subtitle="I'm setting up Mira for someone I look after."
              onPress={() => {
                // TODO: router.push("/caregiver-setup")
              }}
            />
            <OptionCard
              sz={sz}
              icon="check-circle"
              iconColor={lightBlue}
              title="I'm checking in"
              subtitle="I'm using Mira for myself"
              onPress={() => {
                // TODO: router.push("/self-setup")
              }}
            />
          </View>
          <Pressable
            accessibilityRole="link"
            hitSlop={12}
            onPress={() => router.back()}
            style={[styles.backLink, { marginTop: sz(20) }]}
          >
            <AppText
              maxFontSizeMultiplier={1.3}
              style={[styles.backText, { fontSize: sz(28) }]}
            >
              Back
            </AppText>
          </Pressable>
        </WhiteArcSection>
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
  top: {
    paddingHorizontal: 23,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerText: {
    color: darkBlue,
    fontWeight: "500",
  },
  headerBrand: {
    color: "black",
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 10,
  },
  calloutText: {
    color: "black",
    fontWeight: "500",
    textAlign: "center",
  },
  question: {
    textAlign: "center",
    color: WHITE,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 420, // keeps cards from stretching too wide on big screens
    alignSelf: "center",
  },
  buttonOption: {
    flexDirection: "row", // icon | text | chevron in one row
    alignItems: "center",
    borderWidth: 2,
    borderColor: lighterBlue,
    backgroundColor: WHITE,
    // soft tinted shadow (iOS / web)
    shadowColor: lighterBlue,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    // Android
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextContainer: {
    flex: 1, // takes the space between icon and chevron, lets text wrap
  },
  buttonTitle: {
    fontWeight: "800",
    color: "black",
  },
  buttonSubtitle: {
    color: "black",
  },
  backLink: {
    alignSelf: "center",
  },
  backText: {
    textDecorationLine: "underline",
    color: WHITE,
    textAlign: "center",
  },
});