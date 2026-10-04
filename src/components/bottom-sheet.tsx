import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: ReactNode;
};

export function BottomSheet({ visible, title, subtitle, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 1. Dark overlay: tapping it closes the sheet */}
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

      {/* 2. The white sheet, pinned to the bottom */}
      <View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 10,
            // On short phones the sheet stops below the status bar and its content scrolls
            maxHeight: screenH - insets.top - 8,
          },
        ]}
      >
        {/* 3. Grey handle */}
        <View style={styles.handle} />

        {/* 4. Title row with close button */}
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText style={styles.title}>{title}</AppText>
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
          </View>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M18 6L6 18" stroke="#15163A" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>

        {/* 5. Whatever you put inside <BottomSheet>...</BottomSheet> */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={styles.body}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 22, 58, 0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    gap: 18,
  },
  body: {
    gap: 18,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DCD9E8",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    color: "#15163A",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 22,
    color: "#54566E",
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
});