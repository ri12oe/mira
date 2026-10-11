import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { EASE_OUT, useReduceMotion } from "@/hooks/use-entrance";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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

  // ---- Drag down to close ----
  // `drag` is how far the finger has pulled the sheet down, in pixels.
  const [drag] = useState(() => new Animated.Value(0));
  // The drag handlers are rebuilt only if onClose or the sheet's height changes.
  const pan = useMemo(() => {
    const snapBack = () =>
      Animated.spring(drag, { toValue: 0, damping: 20, stiffness: 260, mass: 1, useNativeDriver: true }).start();

    return PanResponder.create({
      // Only take over for a clear downward drag, so taps (like the close button) still work
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      // Down follows the finger; pulling up past the top only gives a little (it resists)
      onPanResponderMove: (_, g) => drag.setValue(g.dy > 0 ? g.dy : -Math.sqrt(-g.dy) * 2),
      onPanResponderRelease: (_, g) => {
        const flicked = g.vy > 0.8; // a quick flick is enough, even if it's short
        const pulledFar = g.dy > sheetHeight * 0.3; // or dragged a third of the way down
        if (flicked || pulledFar) onClose();
        else snapBack();
      },
      onPanResponderTerminate: snapBack,
    });
  }, [drag, onClose, sheetHeight]);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? (reduced ? 150 : 400) : reduced ? 120 : 250,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) {
        setShown(false);
        drag.setValue(0); // ready for next time
      }
    });
    return () => anim.stop();
  }, [visible, reduced, progress, drag]);

  // The overlay is fully dark once the sheet is ~60% of the way up
  // and it lightens as the sheet is dragged down.
  const dragFade = drag.interpolate({ inputRange: [0, sheetHeight], outputRange: [1, 0], extrapolate: "clamp" });
  const scrimOpacity = Animated.multiply(
    progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
    dragFade,
  );
  // The sheet slides up by its own height, plus however far it's being dragged.
  // With Reduce motion on, opening and closing only fade (dragging still moves it).
  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] });
  const sheetMotion = reduced
    ? { opacity: progress, transform: [{ translateY: drag }] }
    : { transform: [{ translateY: Animated.add(slide, drag) }] };

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
          {/* 3 + 4. Grey handle and title row: drag either one down to close the sheet */}
          <View {...pan.panHandlers} style={styles.dragArea}>
            <View style={styles.handle} />

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
  // Same spacing between the handle and the title as the rest of the sheet
  dragArea: {
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