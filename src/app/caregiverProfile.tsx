import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { Chip } from "@/components/chip";
import { FontFamily, FigtreeFont } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const PRIMARY = "#4338CA";
const LILAC = "#E7E4FB";
const SUBTITLE = "#54566E";

const AVATAR_SIZE = 104;
const CAMERA_SIZE = 38;

const FIELD_LABELS = {
  name: "Name",
  phone: "Phone Number",
  email: "Email",
  relationship: "Relationship",
};
type ProfileField = keyof typeof FIELD_LABELS;
const RELATIONSHIPS = ["Family", "Friend", "Neighbor"];

function fieldError(field: ProfileField, value: string) {
  const trimmed = value.trim();
  if (field === "name" && !trimmed) return "Enter your first name.";
  if (field === "phone" && !/^\+?[\d\s().-]+$/.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  if (field === "phone" && trimmed.replace(/\D/g, "").length < 7) {
    return "Enter a phone number with at least 7 digits.";
  }
  if (field === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address, or leave it blank.";
  }
  if (field === "relationship" && !trimmed) return "Enter how this person knows you.";
  return "";
}

export default function CaregiverProfile() {
  const {
    firstName, yourFirstName, yourPhone, yourEmail, yourPhotoUri,
    caregiverRelationship, people, selectedId, update, updatePerson,
  } = useCaregiverSetup();
  const selectedPerson = people.find((person) => person.id === selectedId);
  const personName = (selectedPerson?.firstName ?? firstName).trim();
  const [draft, setDraft] = useState({
    name: yourFirstName,
    phone: yourPhone,
    email: yourEmail,
    relationship: selectedPerson
      ? selectedPerson.caregiverRelationship ?? ""
      : caregiverRelationship,
  });
  const [field, setField] = useState<ProfileField | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const edit = (nextField: ProfileField) => {
    setValue(draft[nextField]);
    setError("");
    setMessage("");
    setField(nextField);
  };
  const finishEditing = () => {
    if (!field) return;
    const validationError = fieldError(field, value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setDraft((previous) => ({ ...previous, [field]: value.trim() }));
    setField(null);
  };
  const save = () => {
    for (const key of ["name", "phone", "email"] as const) {
      const validationError = fieldError(key, draft[key]);
      if (validationError) {
        edit(key);
        setError(validationError);
        return;
      }
    }
    update({
      yourFirstName: draft.name.trim(),
      yourPhone: draft.phone.trim(),
      yourEmail: draft.email.trim(),
      ...(!selectedPerson && { caregiverRelationship: draft.relationship.trim() }),
    });
    if (selectedPerson) {
      updatePerson(selectedPerson.id, { caregiverRelationship: draft.relationship.trim() });
    }
    setMessage("Your profile changes have been saved for this app session.");
  };
  const changePhoto = async () => {
    setMessage("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled) return;
      const photo = result.assets[0];
      if (!photo?.uri) {
        throw new Error("The photo picker did not return a usable photo.");
      }
      update({ yourPhotoUri: photo.uri });
    } catch (cause) {
      console.error("Unable to select a profile photo", cause);
      setMessage("Unable to open or use the selected photo. Please try again.");
    }
  };

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
          <View style={styles.avatar}>
            {yourPhotoUri ? (
              <Image
                source={{ uri: yourPhotoUri }}
                style={styles.avatarImage}
                contentFit="cover"
                accessibilityLabel="Your profile photo"
                onError={(event) => {
                  console.error("Unable to display profile photo", event.error);
                  setMessage("Your profile photo could not be displayed. Please choose another photo.");
                }}
              />
            ) : (
              <AppText style={styles.avatarText}>
                {draft.name.trim().charAt(0).toUpperCase() || "?"}
              </AppText>
            )}
            <Pressable
              style={({ pressed }) => [styles.changePhoto, pressed && styles.changePhotoPressed]}
              onPress={changePhoto}
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
            <AppText style={styles.pillText}>
              {personName ? `Caregiver for ${personName}` : "Caregiver"}
            </AppText>
          </View>
        </View>
        <View style={styles.details}>
          {(["name", "phone", "email"] as const).map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.field,
                key === "email" && styles.lastField,
                pressed && styles.pressed,
              ]}
              onPress={() => edit(key)}
              accessibilityRole="button"
              accessibilityLabel={`Change ${FIELD_LABELS[key]}${draft[key] ? `: ${draft[key]}` : ""}`}
            >
              <View style={styles.fieldFrame}>
                <AppText style={styles.fieldLabel}>{FIELD_LABELS[key]}</AppText>
                <AppText style={styles.fieldValue}>
                  {draft[key].trim() || `Add ${FIELD_LABELS[key]}`}
                </AppText>
              </View>
              <ArrowRightIcon size={18} />
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.how, pressed && styles.pressed]}
          onPress={() => edit("relationship")}
          accessibilityRole="button"
          accessibilityLabel={personName ? `Change how ${personName} knows you` : "Change your relationship"}
        >
          <View style={styles.howFrame}>
            <AppText style={styles.howText}>
              {personName ? `How ${personName} knows you` : "How they know you"}
            </AppText>
            <AppText style={styles.howDescription}>
              {draft.relationship || "Add a relationship"}
            </AppText>
          </View>
          <ArrowRightIcon size={18} />
        </Pressable>
        <AppText style={styles.note}>
          {personName || "The person you care for"} sees your first name and phone
          number so they know who&apos;s looking out for them.
        </AppText>
        <View style={styles.spacer}></View>
        <View style={styles.action}>
          {message ? <AppText style={styles.feedback} accessibilityLiveRegion="polite">{message}</AppText> : null}
          <Pressable style={styles.saveButton} onPress={save} accessibilityRole="button">
            <AppText style={styles.saveButtonText}>Save changes</AppText>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            accessibilityRole="button"
            onPress={() => setMessage("Account deletion is not available yet. No account or data has been deleted.")}
          >
            <AppText style={styles.deleteButtonText}>Delete my account</AppText>
          </Pressable>
        </View>
      </ScrollView>
      <BottomSheet
        visible={field !== null}
        title={field ? `Change ${FIELD_LABELS[field]}` : ""}
        onClose={() => setField(null)}
        keyboardAware
      >
        {field !== null && (
          <>
            {field === "relationship" && (
              <View style={styles.chips}>
                {RELATIONSHIPS.map((relationship) => (
                  <Chip
                    key={relationship}
                    label={relationship}
                    variant="pill"
                    selected={value === relationship}
                    onPress={() => { setValue(relationship); setError(""); }}
                  />
                ))}
              </View>
            )}
            <TextInput
              key={field}
              value={value}
              onChangeText={(text) => { setValue(text); setError(""); }}
              style={styles.input}
              placeholder={field === "relationship" ? "e.g. Family or Coworker" : FIELD_LABELS[field]}
              placeholderTextColor={SUBTITLE}
              accessibilityLabel={FIELD_LABELS[field]}
              autoFocus
              autoCapitalize={field === "email" ? "none" : "words"}
              autoCorrect={field === "name" || field === "relationship"}
              keyboardType={field === "phone" ? "phone-pad" : field === "email" ? "email-address" : "default"}
              autoComplete={field === "name" ? "given-name" : field === "phone" ? "tel" : field === "email" ? "email" : "off"}
              onSubmitEditing={finishEditing}
              returnKeyType="done"
            />
            {error ? <AppText style={styles.error} accessibilityLiveRegion="polite">{error}</AppText> : null}
            <Pressable style={styles.saveButton} onPress={finishEditing} accessibilityRole="button">
              <AppText style={styles.saveButtonText}>Done</AppText>
            </Pressable>
            <AppText style={styles.note}>Tap Save changes on your profile to save these details.</AppText>
          </>
        )}
      </BottomSheet>
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
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderColor: "#E6E4EF",
  },
  fieldFrame: {
    flex: 1,
    gap: 2,
  },
  lastField: {
    borderBottomWidth: 0,
  },
  pressed: {
    opacity: 0.75,
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#E6E4EF",
    borderRadius: 14,
    padding: 16,
    color: INK,
    fontFamily: FigtreeFont.medium,
    fontSize: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feedback: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    alignSelf: "stretch",
  },
  error: {
    color: "#A52F22",
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
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
  how: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6E4EF",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  howFrame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  howText: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
  howDescription: {
    color: INK,
    fontSize: 18,
    lineHeight: 23.4,
    fontFamily: FigtreeFont.bold,
  },
  note: {
    alignSelf: "stretch",
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.medium,
  },
  spacer: {
    flex: 1,
    alignSelf: "stretch"
  },
  action: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
  },
  saveButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 19,
    lineHeight: 22.8,
    fontFamily: FigtreeFont.bold,
  },
  deleteButton: {
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  deleteButtonText: {
    color: "#A52F22",
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
});