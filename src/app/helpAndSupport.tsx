import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { FontFamily, FigtreeFont } from "@/constants/fonts";
import { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import PhoneIcon from "@/components/icons/PhoneIcon";
import MessageIcon from "@/components/icons/MessageIcon";
const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const SEARCH_TEXT_COLOR = "#8B8DA3";
const PRIMARY = "#4338CA";
const ORANGE = "#C2551F";
const BORDERCOLOR = "#E6E4EF";
const SUBTITLE = "#54566E";
const SUN = "#FFE8DB";
const SELECTED_BG = "#F1EFFD";
const DIVIDER = "#EFEDF5";
const ANSWER_TEXT = "#3A3C55";

const FAQS = [
  {
    q: "What happens if Lin misses a check-in?",
    a: "We send Lin a reminder, then call her. If she still hasn't checked in, we alert you, then your backup contacts in the order you chose.",
  },
  {
    q: "How do I pause check-ins for a trip?",
    a: "Go to Settings and turn on Pause check-ins. Nobody is alerted until you turn it back off.",
  },
  {
    q: "What can Lin see about me?",
    a: "Your first name and phone number, so she knows who's looking out for her.",
  },
  {
    q: "Does Lin need a smartphone?",
    a: "No. Text reply and phone call check-ins work on any phone, including landlines for calls.",
  },
];

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
        style={({ pressed }) => [styles.faqQuestion, pressed && styles.faqQuestionPressed]}
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

export default function HelpAndSupport() {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFaqs = FAQS.filter(
    ({ q, a }) =>
      q.toLowerCase().includes(normalizedQuery) ||
      a.toLowerCase().includes(normalizedQuery),
  );

  const toggle = (i: number) => {
    // smooth open/close instead of a jump
    LayoutAnimation.configureNext(LayoutAnimation.create(200, "easeInEaseOut", "opacity"));
    setOpenIndex((current) => (current === i ? -1 : i));
  };

  const showContactNotice = (action: string) => {
    Alert.alert(
      "Contact details coming soon",
      `${action} is not available yet. Please check back soon.`,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <AppText style={styles.title}>Help and support</AppText>
        </View>
        <View style={[styles.search, isSearchFocused && styles.searchFocused]}>
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M9.16683 15C12.3885 15 15.0002 12.3884 15.0002 9.16671C15.0002 5.94505 12.3885 3.33337 9.16683 3.33337C5.94517 3.33337 3.3335 5.94505 3.3335 9.16671C3.3335 12.3884 5.94517 15 9.16683 15Z"
              stroke="#54566E"
              strokeWidth={1.83333}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M16.6668 16.6667L13.3335 13.3334"
              stroke="#54566E"
              strokeWidth={1.83333}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <TextInput
            accessibilityLabel="Search help questions"
            placeholder="Search for help"
            underlineColorAndroid="transparent"
            placeholderTextColor={SEARCH_TEXT_COLOR}
            returnKeyType="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={styles.searchText}
          />
        </View>
        <View style={styles.contact}>
          <Pressable
            accessibilityRole="button"
            onPress={() => showContactNotice("Calling support")}
            style={({ pressed }) => [
              styles.callUseButton,
              pressed && styles.contactButtonPressed,
            ]}
          >
            <View style={[styles.IconTile, { backgroundColor: "#E7E4FB" }]}>
              <PhoneIcon size={22} color={PRIMARY} />
            </View>
            <View style={styles.contactFrame}>
              <AppText style={styles.contactText}>Call us</AppText>
              <AppText style={styles.contactSubText}>Talk to a person</AppText>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => showContactNotice("Messaging support")}
            style={({ pressed }) => [
              styles.callUseButton,
              pressed && styles.contactButtonPressed,
            ]}
          >
            <View style={[styles.IconTile, { backgroundColor: SUN }]}>
              <MessageIcon size={22} color={ORANGE} />
            </View>
            <View style={styles.contactFrame}>
              <AppText style={styles.contactText}>Message us</AppText>
              <AppText style={styles.contactSubText}>We&apos;ll reply by email</AppText>
            </View>
          </Pressable>
        </View>
        <View style={styles.commonQuestions}>
          <AppText style={styles.commonQuestionsTitle}>Common Questions</AppText>
          <View style={styles.accordion}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => {
                const index = FAQS.indexOf(item);
                return (
                  <FaqRow
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                    open={openIndex === index}
                    isLast={item === filteredFaqs[filteredFaqs.length - 1]}
                    onToggle={() => toggle(index)}
                  />
                );
              })
            ) : (
              <AppText style={styles.noResults}>
                No questions match your search. Try a different keyword.
              </AppText>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.feedbackFooter}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              "Feedback coming soon",
              "Sending feedback is not available yet. Please check back soon.",
            )
          }
          style={({ pressed }) => [
            styles.feedbackButton,
            pressed && styles.feedbackButtonPressed,
          ]}
        >
          <AppText style={styles.feedbackButtonText}>Send us feedback</AppText>
        </Pressable>
      </View>
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
  search: {
    height: 52,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCD9E8",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  searchText: {
    flex: 1,
    height: "100%",
    padding: 0,
    borderWidth: 0,
    color: INK,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 22.1,
    ...Platform.select({
      web: {
        outlineStyle: "solid",
        outlineWidth: 0,
        outlineColor: "transparent",
      },
    }),
  },
  searchFocused: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  contact: {
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  callUseButton: {
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  contactButtonPressed: {
    opacity: 0.7,
  },
  IconTile: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
  },
  contactFrame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  contactText: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
  },
  contactSubText: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: FigtreeFont.medium,
  },
  commonQuestions: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  commonQuestionsTitle: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },

  // ---- accordion ----
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
  faqQuestionPressed: {
    opacity: 0.7,
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
  noResults: {
    padding: 16,
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 22.5,
    fontFamily: FigtreeFont.medium,
  },
  feedbackFooter: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: BACKGROUND,
  },
  feedbackButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  feedbackButtonPressed: {
    opacity: 0.7,
  },
  feedbackButtonText: {
    color: PRIMARY,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
});