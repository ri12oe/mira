import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { RadioCircle } from "@/components/radio-circle";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { toE164 } from "@/utils/phone";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgress } from "@/components/step-progress";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const MINT = "#DDF3EE";
const SURFACE = "#DCD9E8";
const SELECTED_BG = "#F1EFFD";
const MUTED = "#8B8DA3";

/**
 * Someone using Mira for themselves checks in with the app: it's the one way
 * that really reaches them while Mira is in free/test mode (no real texts or
 * calls yet). Text and phone call can come back here once real delivery is on.
 */
function AppMethodCard() {
  return (
    <View
      style={[styles.methodButton, styles.methodButtonSelected]}
      accessible
      accessibilityLabel="You'll check in with the Mira app. Tap one button each day."
    >
      <View style={styles.methodButtonContent}>
        <View style={[styles.methodButtonIcon, { backgroundColor: MINT }]}>
          <PhoneSquareIcon />
        </View>
        <View style={styles.methodButtonLabel}>
          <AppText style={styles.methodButtonLabelHeader}>Mira app</AppText>
          <AppText style={styles.methodButtonLabelSubtext}>
            Tap one button each day
          </AppText>
        </View>
        <RadioCircle selected />
      </View>
    </View>
  );
}

export default function SelfSetup1() {
  const { yourFirstName, yourPhone, update } = useCaregiverSetup();
  // This number becomes how they sign in, so it has to be a full one
  const isValid = !!yourFirstName.trim() && !!toE164(yourPhone);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/whoUsesMira");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <BackButton onPress={goBack} />
          <StepProgress step={1} total={3} />
        </View>

        <View style={styles.callout}>
          <AppText style={styles.calloutText}>Tell us about you</AppText>
        </View>

        <View style={styles.information}>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>Your First Name</AppText>
            <TextInput
              style={styles.inputField}
              value={yourFirstName}
              onChangeText={(text) => update({ yourFirstName: text })}
              placeholder="e.g. Sarah"
              accessibilityLabel="Your First Name"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
            />
          </View>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>Your Phone Number</AppText>
            <TextInput
              style={styles.inputField}
              value={yourPhone}
              onChangeText={(text) => update({ yourPhone: text })}
              placeholder="(555) 123-4567"
              accessibilityLabel="Your Phone Number"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </View>
        </View>

        <View style={styles.methods}>
          <AppText style={styles.methodCallout}>How you&apos;ll check in</AppText>
          <AppMethodCard />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              !isValid && styles.nextButtonDisabled,
              pressed && isValid && styles.pressed,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            disabled={!isValid}
            onPress={() => router.push("/selfSetup2")}
          >
            <AppText
              style={[
                styles.nextButtonText,
                !isValid && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
  },
  callout: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  information: {
    marginTop: 24,
    gap: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  NameContainer: {
    flexDirection: "column",
    gap: 8,
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  inputLabel: {
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    color: INK,
    lineHeight: 22.1,
  },
  inputField: {
    height: 56,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    color: INK,
    fontSize: 18,
    fontFamily: FigtreeFont.bold,
  },
  methods: {
    marginTop: 24,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  methodCallout: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },

  // Option card: unselected
  methodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  // Option card: selected. The border grows from 1 to 2, so padding shrinks by 1
  // to keep the card exactly the same size (no jump when you tap).
  methodButtonSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  methodButtonContent: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  methodButtonIcon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  methodButtonLabel: {
    gap: 2,
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },
  methodButtonLabelHeader: {
    alignSelf: "stretch",
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  methodButtonLabelSubtext: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21,
  },
  buttons: {
    marginTop: 49,
  },
  nextButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  nextButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  nextButtonDisabled: {
    backgroundColor: "#D9D6EA",
  },
  nextButtonTextDisabled: {
    color: SUBTITLE,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
