import { AppText } from "@/components/app-text";
import { CornerClouds, useCornerCloudSize } from "@/components/conor_clouds";
import { WhiteArcSection } from "@/components/white_arc";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { ComponentProps } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
//  New Colors to test out
const lightGreen = "#A8D130";
const darkBlue = "#1C2E9D";
const lightBlue = "#414DC7";
const lightPurple = "#B024F1";
const lighterBlue = "#349AD5";
const WHITE = "#FFF";
const SUBTLE = "#4A5575";


type OptionCardProps = {
  icon: ComponentProps<typeof Feather>["name"];
  iconColor: string; // icon circle background
  title: string;
  subtitle: string;
  onPress: () => void;
};

function OptionCard({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.buttonOption,
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
        <Feather name={icon} size={26} color={WHITE} />
      </View>

      <View style={styles.buttonTextContainer}>
        <AppText maxFontSizeMultiplier={1.6} style={styles.buttonTitle}>
          {title}
        </AppText>
        <AppText maxFontSizeMultiplier={1.8} style={styles.buttonSubtitle}>
          {subtitle}
        </AppText>
      </View>

      <Entypo name="chevron-right" size={26} color={darkBlue} />
    </Pressable>
  );
}

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  const { height: cloudH } = useCornerCloudSize();
  return (
    <View style={styles.screen}>
      <CornerClouds />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(cloudH * 0.6, insets.top + 16),
          paddingHorizontal: 23,
          flexGrow: 1,
        }}
      >
        <View style={styles.header}>
          <AppText style={styles.headerText}>welcome to</AppText>
          <AppText style={styles.headerBrand}>Mira</AppText>
        </View>
        <AppText style={styles.calloutText}>
          A short check-in each day so the people who care for you know you’re
          okay.
        </AppText>
        <WhiteArcSection
          style={{ marginTop: 32, paddingBottom: insets.bottom + 24 }}
        >
          <AppText style={styles.question}>Who is using Mira?</AppText>
          <View style={styles.buttonContainer}>
            <OptionCard
              icon="heart"
              iconColor={lightBlue}
              title="I'm a caregiver"
              subtitle="I'm setting up Mira for someone I look after."
              onPress={() => {}}
            />
             <OptionCard
              icon="check-circle"
              iconColor={lightBlue}
              title="I'm checking in"
              subtitle="I'm using Mira for myself"
              onPress={() => {
                // TODO: router.push("/self-setup")
              }}
            />
          </View>
          <Pressable>
            <AppText style={styles.backText}>Back</AppText>
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
  calloutText: {
    color: "black",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 500,
    textAlign: "center",
    padding: 20,
  },
  question: {
    textAlign: "center",
    fontSize: 32,
    color: WHITE,
    lineHeight: 40,
    fontWeight: "500",
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 18,
    width: "100%",
    maxWidth: 420, // keeps cards from stretching too wide on big screens
    alignSelf: "center",
  },
  buttonOption: {
    flexDirection: "row", // icon | text | chevron in one row
    alignItems: "center",
    gap: 16,
    minHeight: 104, // grows with large text instead of clipping
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 28,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextContainer: {
    flex: 1, // takes the space between icon and chevron, lets text wrap
    gap: 4,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "black",
  },
  buttonSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "black",
  },
  backText: {
    fontSize: 32,
    textDecorationLine: "underline",
    color: WHITE,
    textAlign: "center",
    marginTop: 24,
  },
});
