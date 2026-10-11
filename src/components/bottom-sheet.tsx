import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { EASE_OUT, useReduceMotion } from "@/hooks/use-entrance";
import { ReactNode, useEffect, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  keyboardAware?: boolean;
};

export function BottomSheet({ visible, title, subtitle, onClose, children, keyboardAware = false }: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const reduced = useReduceMotion();

  // Animation (from the canvas): the dark overlay fades in while the sheet slides up.
  // Closing plays it backwards, a bit faster. 0 = hidden, 1 = fully open.
  const [progress] = useState(() => new Animated.Value(0));
  const [sheetHeight, setSheetHeight] = useState(screenH);

  // The Modal has to stay open while the closing animation plays,
  // so `shown` turns on with `visible` but only turns off once the sheet is gone.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? (reduced ? 150 : 400) : reduced ? 120 : 250,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) setShown(false);
    });
    return () => anim.stop();
  }, [visible, reduced, progress]);

  // The overlay is fully dark once the sheet is ~60% of the way up
  const scrimOpacity = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] });
  // The sheet slides up by its own height. With Reduce motion on it only fades.
  const sheetMotion = reduced
    ? { opacity: progress }
    : { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] }) }] };

  return (
    // animationType="none": we animate the overlay and the sheet ourselves.
    // ("slide" moved the dark overlay up together with the sheet.)
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose}>
      {/* 1. Dark overlay: tapping it closes the sheet */}
      <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      {/* 2. The white sheet, pinned to the bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={keyboardAware}
        style={styles.keyboardContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            keyboardAware && styles.keyboardSheet,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 10,
              // On short phones the sheet stops below the status bar and its content scrolls
              maxHeight: screenH - insets.top - 8,
            },
            sheetMotion,
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
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
  keyboardSheet: {
    position: "relative",
    flexShrink: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
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