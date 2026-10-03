import { AppText } from "@/components/app-test";
import { RadioCircle } from "@/components/radio-circle";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const SURFACE = "#DCD9E8";
const LILAC = "#E7E4FB";
const SELECTED_BG = "#F1EFFD";
const MUTED = "#8B8DA3";

type MethodId = "text" | "call" | "app";

type Method = {
  id: MethodId;
  title: string;
  subtitle: string;
  iconBg: string;
  icon: React.ReactNode;
};

const METHODS: Method[] = [
  {
    id: "text",
    title: "Text reply",
    subtitle: "Replies OK to a daily text",
    iconBg: LILAC,
    icon: (
      <MessageIcon />
    ),
  },
  {
    id: "call",
    title: "Phone call",
    subtitle: "Presses 1 on a short call",
    iconBg: SUN,
    icon: (
      <PhoneIcon />
    ),
  },
  {
    id: "app",
    title: "Mira app",
    subtitle: "Taps one button in the app",
    iconBg: MINT,
    icon: (
      <PhoneSquareIcon />
    ),
  },
];

function MethodOption({
  method,
  selected,
  onSelect,
}: {
  method: Method;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${method.title}. ${method.subtitle}`}
      style={({ pressed }) => [
        styles.methodButton,
        selected && styles.methodButtonSelected,
        pressed && styles.methodButtonPressed,
      ]}
    >
      <View style={styles.methodButtonContent}>
        <View
          style={[styles.methodButtonIcon, { backgroundColor: method.iconBg }]}
        >
          {method.icon}
        </View>
        <View style={styles.methodButtonLabel}>
          <AppText style={styles.methodButtonLabelHeader}>
            {method.title}
          </AppText>
          <AppText style={styles.methodButtonLabelSubtext}>
            {method.subtitle}
          </AppText>
        </View>
        <RadioCircle selected={selected} />
      </View>
    </Pressable>
  );
}

export default function CaregiverSetup1() {
  const {
    firstName,
    phone,
    yourFirstName,
    yourPhone,
    method,
    update,
    displayName,
  } = useCaregiverSetup();
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
          <Pressable
            onPress={goBack}
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
          <View style={styles.barContainer}>
            <AppText style={styles.barText}>Step 1 of 3</AppText>
            <View style={styles.bar}>
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={styles.barSegment} />
              <View style={styles.barSegment} />
            </View>
          </View>
        </View>

        <View style={styles.callout}>
          <AppText style={styles.calloutText}>Who are you caring for?</AppText>
        </View>

        <View style={styles.information}>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>First Name</AppText>
            <TextInput
              style={styles.inputField}
              value={firstName}
              onChangeText={(text) => update({ firstName: text })}
              placeholder="e.g. John"
              accessibilityLabel="First Name"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
            />
          </View>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>Their Phone Number</AppText>
            <TextInput
              style={styles.inputField}
              value={phone}
              onChangeText={(text) => update({ phone: text })}
              placeholder="(555) 123-4567"
              accessibilityLabel="Their Phone Number"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </View>
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

        <View style={styles.methods} accessibilityRole="radiogroup">
          <AppText style={styles.methodCallout}>
            How will {displayName} check in?
          </AppText>
          {METHODS.map((m) => (
            <MethodOption
              key={m.id}
              method={m}
              selected={method === m.id}
              onSelect={() => update({ method: m.id })}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            onPress={() => router.push("/caregiverSetup2")}
          >
            <AppText style={styles.nextButtonText}>Next</AppText>
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
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
  },
  barContainer: {
    alignItems: "flex-start",
    gap: 8,
    flexDirection: "column",
    flex: 1,
  },
  barText: {
    fontFamily: FigtreeFont.bold,
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
  },
  bar: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 6,
    flexDirection: "row",
  },
  barSegment: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  barActive: {
    backgroundColor: PRIMARY,
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
  // While the finger is down
  methodButtonPressed: {
    transform: [{ scale: 0.98 }],
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
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
