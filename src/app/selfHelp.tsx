import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import MiraIcon from "@/components/icons/MiraIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { avatarColors } from "@/utils/avatar-colors";
import * as Linking from "expo-linking";
import { useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const PRIMARY = "#4338CA";
const BORDERCOLOR = "#E6E4EF";
const SUBTITLE = "#54566E";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";
const TEAL = "#0B7A66";
const SELECTED_BG = "#F1EFFD";
const DIVIDER = "#EFEDF5";
const ANSWER_TEXT = "#3A3C55";

function FaqRow({
  question,
  answer,
  open,
  isLast,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.faqRow, !isLast && styles.faqDivider, open && styles.faqRowOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={question}
        style={({ pressed }) => [styles.faqQuestion, pressed && styles.pressed]}
      >
        <AppText style={styles.faqQuestionText}>{question}</AppText>
        {/* the chevron flips upside down when open */}
        <View
          style={[
            styles.chevron,
            open && styles.chevronOpen,
            { transform: [{ rotate: open ? "180deg" : "0deg" }] },
          ]}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 9l6 6 6-6"
              stroke={open ? "#FFFFFF" : SUBTITLE}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
      {open && <AppText style={styles.faqAnswer}>{answer}</AppText>}
    </View>
  );
}

export default function SelfHelp() {
  const { backups } = useCaregiverSetup();
  const firstBackup = backups[0];
  const who = firstBackup?.name ?? "my backup";
  const [openIndex, setOpenIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const faqs = [
    {
      q: "What if I forget to check in?",
      a: `We'll send you a reminder, then give you a call. If we still can't reach you, we let ${firstBackup?.name ?? "your backup contact"} know so they can check on you.`,
    },
    {
      q: "Can I take a break?",
      a: "Yes. Go to Settings and turn on Take a break. Nobody is alerted until you turn it back off.",
    },
    {
      q: `What does ${who} see?`,
      a: "Only whether you checked in, and when. Never your messages or where you are.",
    },
    {
      q: "I tapped by mistake. What now?",
      a: `No problem. Let ${firstBackup?.name ?? "your backup contact"} know you're okay. You can call or text them from My people.`,
    },
  ];

  const toggle = (i: number) => {
    // smooth open/close instead of a jump
    LayoutAnimation.configureNext(LayoutAnimation.create(200, "easeInEaseOut", "opacity"));
    setOpenIndex((current) => (current === i ? -1 : i));
  };

  const callBackup = () => {
    if (!firstBackup) return;
    const dial = firstBackup.phone.trim().replace(/[^\d+]/g, "");
    if (!/\d/.test(dial)) {
      setNotice(`We don't have a phone number for ${firstBackup.name}.`);
      return;
    }
    setNotice(null);
    Linking.openURL(`tel:${dial}`).catch(() =>
      setNotice(`We couldn't open the phone. You can call ${firstBackup.name} at ${firstBackup.phone}.`),
    );
  };

  const colors = avatarColors(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <AppText style={styles.title}>Help</AppText>
        </View>

        <View style={styles.contacts}>
          {firstBackup && (
            <Pressable
              onPress={callBackup}
              accessibilityRole="button"
              accessibilityLabel={`Call ${firstBackup.name}`}
              style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                <AppText style={[styles.avatarText, { color: colors.text }]}>
                  {firstBackup.name.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <AppText style={styles.contactName}>Call {firstBackup.name}</AppText>
              <View style={[styles.callTile, { backgroundColor: MINT }]}>
                <PhoneIcon size={20} color={TEAL} />
              </View>
            </Pressable>
          )}
          <Pressable
            onPress={() => setNotice("Calling Mira support isn't available yet. Please check back soon.")}
            accessibilityRole="button"
            accessibilityLabel="Call Mira support. Talk to a real person"
            style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
          >
            <View style={[styles.avatar, { backgroundColor: PRIMARY }]}>
              <MiraIcon size={26} strokeColor="#fff" />
            </View>
            <View style={styles.contactText}>
              <AppText style={styles.contactName}>Call Mira support</AppText>
              <AppText style={styles.contactSub}>Talk to a real person</AppText>
            </View>
            <View style={[styles.callTile, { backgroundColor: LILAC }]}>
              <PhoneIcon size={20} color={PRIMARY} />
            </View>
          </Pressable>
          {notice && (
            <AppText style={styles.notice} accessibilityRole="alert">
              {notice}
            </AppText>
          )}
        </View>

        <View style={styles.commonQuestions}>
          <AppText style={styles.commonQuestionsTitle}>Common questions</AppText>
          <View style={styles.accordion}>
            {faqs.map((item, index) => (
              <FaqRow
                key={item.q}
                question={item.q}
                answer={item.a}
                open={openIndex === index}
                isLast={index === faqs.length - 1}
                onToggle={() => toggle(index)}
              />
            ))}
          </View>
        </View>
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
    flex: 1,
  },
  scrollContent: {
    gap: 20,
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    marginTop: 56,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 32.2,
    letterSpacing: -0.4,
  },
  contacts: {
    gap: 12,
    alignSelf: "stretch",
  },
  contactRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: FigtreeFont.extraBold,
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    flex: 1,
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
  },
  contactSub: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: FigtreeFont.medium,
  },
  callTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  notice: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.7,
  },
  commonQuestions: {
    gap: 10,
    alignSelf: "stretch",
  },
  commonQuestionsTitle: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  accordion: {
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    overflow: "hidden", // keeps the open row's lilac inside the rounded corners
  },
  faqRow: {
    backgroundColor: "#fff",
  },
  faqRowOpen: {
    backgroundColor: SELECTED_BG,
  },
  faqDivider: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  faqQuestion: {
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqQuestionText: {
    flex: 1, // takes the space left over, so long questions wrap instead of pushing the chevron off
    color: INK,
    fontSize: 16,
    lineHeight: 21.6,
    fontFamily: FigtreeFont.bold,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronOpen: {
    backgroundColor: PRIMARY,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    color: ANSWER_TEXT,
    fontSize: 15,
    lineHeight: 22.5,
    fontFamily: FigtreeFont.medium,
  },
});
