import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { FigtreeFont } from "@/constants/fonts";
import { CheckInMethod } from "@/context/caregiver-setup";
import { Pressable, StyleSheet, View } from "react-native";

const PRIMARY = "#4338CA";
const SUBTITLE = "#54566E";

export const METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text reply",
  call: "Phone call",
  app: "Mira app",
};

type Props = {
  visible: boolean;
  /** The person's first name; may be empty */
  name: string;
  method: CheckInMethod;
  onChange: (method: CheckInMethod) => void;
  onClose: () => void;
};

/** Bottom sheet for changing how the person checks in. */
export function CheckInMethodSheet({
  visible,
  name,
  method,
  onChange,
  onClose,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      title={name ? `How ${name} checks in` : "How they check in"}
      onClose={onClose}
    >
      {/* TODO: build the method options here. Call onChange(id) when one is picked. */}
      <View style={styles.placeholder}>
        <AppText style={styles.placeholderText}>
          Current method: {METHOD_LABELS[method]}
        </AppText>
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        onPress={onClose}
        accessibilityRole="button"
      >
        <AppText style={styles.saveButtonText}>Save</AppText>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    paddingVertical: 16,
  },
  placeholderText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
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
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
