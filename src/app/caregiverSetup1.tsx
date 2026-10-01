import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { router } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { RadioCircle } from "@/components/radio-circle";
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
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Path
          d="M3.66666 4.58337H18.3333V14.6667H8.25L3.66666 18.3334V4.58337Z"
          stroke="#4338CA"
          strokeWidth={2.01667}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    id: "call",
    title: "Phone call",
    subtitle: "Presses 1 on a short call",
    iconBg: SUN,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Path
          d="M4.58333 3.66663H8.25L10.0833 8.24996L7.79166 9.62496C8.77338 11.6155 10.3844 13.2266 12.375 14.2083L13.75 11.9166L18.3333 13.75V17.4166C18.3333 17.6597 18.2368 17.8929 18.0648 18.0648C17.8929 18.2367 17.6598 18.3333 17.4167 18.3333C13.841 18.116 10.4685 16.5976 7.93542 14.0645C5.40238 11.5315 3.88396 8.15897 3.66666 4.58329C3.66666 4.34018 3.76324 4.10702 3.93515 3.93511C4.10706 3.7632 4.34022 3.66663 4.58333 3.66663Z"
          stroke="#C2551F"
          strokeWidth={2.01667}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    id: "app",
    title: "Mira app",
    subtitle: "Taps one button in the app",
    iconBg: MINT,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Path
          d="M13.75 2.29163H8.25C6.73122 2.29163 5.5 3.52284 5.5 5.04163V16.9583C5.5 18.4771 6.73122 19.7083 8.25 19.7083H13.75C15.2688 19.7083 16.5 18.4771 16.5 16.9583V5.04163C16.5 3.52284 15.2688 2.29163 13.75 2.29163Z"
          stroke="#0B7A66"
          strokeWidth={2.01667}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.625 16.9584H12.375"
          stroke="#0B7A66"
          strokeWidth={2.01667}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
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
        <View style={[styles.methodButtonIcon, { backgroundColor: method.iconBg }]}>{method.icon}</View>
        <View style={styles.methodButtonLabel}>
          <AppText style={styles.methodButtonLabelHeader}>{method.title}</AppText>
          <AppText style={styles.methodButtonLabelSubtext}>{method.subtitle}</AppText>
        </View>
        <RadioCircle selected={selected} />
      </View>
    </Pressable>
  );
}

export default function CaregiverSetup1() {
  const { firstName, phone, method, update, displayName } = useCaregiverSetup();
  const goBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/whoUsesMira");
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
        </View>

        <View style={styles.methods} accessibilityRole="radiogroup">
          <AppText style={styles.methodCallout}>How will {displayName} check in?</AppText>
          {METHODS.map((m) => (
            <MethodOption key={m.id} method={m} selected={method === m.id} onSelect={() => update({ method: m.id })}/>
          ))}
        </View>

        <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
              accessibilityLabel="Next"
              accessibilityRole="button"
              onPress={() => router.push("/caregiverSetup2")}
            >
              <AppText style={styles.nextButtonText}>Next</AppText>
            </Pressable>
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