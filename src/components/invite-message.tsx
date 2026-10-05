import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDERCOLOR = "#E6E4EF";
const SELECTED_BG = "#F1EFFD";

type Props = {
  /** Who the invite goes to, shown in the heading */
  recipientName: string;
  phone: string;
  /** The full text that will be sent */
  message: string;
  /** Omit to hide the Edit link */
  onEdit?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** "We'll text {name} this invite" with an Edit link and a text-bubble preview. */
export function InviteMessage({
  recipientName,
  phone,
  message,
  onEdit,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <AppText style={styles.labelText}>
          We&apos;ll text {recipientName} this invite
        </AppText>
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit invite"
          >
            <AppText style={styles.editText}>Edit</AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.messagePreview}>
        <View style={styles.messageTo}>
          <Svg width={16} height={16} viewBox="0 0 22 22" fill="none">
            <Path
              d="M3.66666 4.58337H18.3333V14.6667H8.25L3.66666 18.3334V4.58337Z"
              stroke="#54566E"
              strokeWidth={2.01667}
              strokeLinejoin="round"
            />
          </Svg>
          <AppText style={styles.phone}>TEXT TO {phone}</AppText>
        </View>
        <View style={styles.messageContent}>
          <AppText style={styles.messageText}>{message}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  labelRow: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  labelText: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  editText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  messagePreview: {
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: BORDERCOLOR,
  },
  messageTo: {
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
  },
  phone: {
    color: SUBTITLE,
    fontSize: 13,
    letterSpacing: 0.4,
    fontFamily: FigtreeFont.extraBold,
  },
  messageContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: SELECTED_BG,
  },
  messageText: {
    color: INK,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.bold,
  },
});
