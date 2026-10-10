import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { FontFamily, FigtreeFont } from "@/constants/fonts";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const PRIMARY = "#4338CA";
const LILAC = "#E7E4FB";
const SUBTITLE = "#54566E";

const AVATAR_SIZE = 104;
const CAMERA_SIZE = 38;

export default function CaregiverProfile() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <AppText style={styles.title}>Your profile</AppText>
        </View>

        <View style={styles.avatarBlock}>
          {/* The circle is the box: the J is centred inside it */}
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>J</AppText>

            {/* Floats over the bottom-right edge of the circle */}
            <Pressable
              style={({ pressed }) => [styles.changePhoto, pressed && styles.changePhotoPressed]}
              onPress={() => {
                // open the photo picker here later
              }}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              hitSlop={6}
            >
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M3 6H5.25L6.75 3.75H11.25L12.75 6H15V14.25H3V6Z"
                  stroke="white"
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 12.375C10.4497 12.375 11.625 11.1997 11.625 9.75C11.625 8.30025 10.4497 7.125 9 7.125C7.55025 7.125 6.375 8.30025 6.375 9.75C6.375 11.1997 7.55025 12.375 9 12.375Z"
                  stroke="white"
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Caregiver for Lin</AppText>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>Name</AppText>
            <AppText style={styles.fieldValue}>Jordan</AppText>
          </View>
          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>Phone Number</AppText>
            <AppText style={styles.fieldValue}>(555) 010-2468</AppText>
          </View>
          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>Email</AppText>
            <AppText style={styles.fieldValue}>Add an Email</AppText>
          </View>
        </View>
        <View style={styles.how}>
          
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
    gap: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 14,
    marginTop: 56,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 32.2,
    letterSpacing: -0.4,
  },
  avatarBlock: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2, // half the width = a circle
    backgroundColor: LILAC,
    justifyContent: "center", // centres the J top-to-bottom
    alignItems: "center", // centres the J left-to-right
  },
  avatarText: {
    color: PRIMARY,
    fontSize: 44,
    lineHeight: 52, // keeps the J optically centred
    includeFontPadding: false, // Android: removes extra space above the letter
    fontFamily: FontFamily.extraBold,
  },
  changePhoto: {
    position: "absolute", // sits on top instead of below the J
    right: -2, // measured from the circle's edge; 0 = inside, -6 = further out
    bottom: -2,
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: BACKGROUND, // page-coloured ring looks like a cut-out
    backgroundColor: PRIMARY,
  },
  changePhotoPressed: {
    transform: [{ scale: 0.94 }],
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: "#FFE8DB",
  },
  pillText: {
    color: "#8A3A12",
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  details: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6E4EF",
    backgroundColor: "#fff",
  },
  field: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderColor: "#E6E4EF",
  },
  fieldLabel: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
  fieldValue: {
    color: INK,
    fontSize: 18,
    lineHeight: 23.4,
    fontFamily: FigtreeFont.bold,
  },
});