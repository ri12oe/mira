import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

export const ITEM_H = 44; // height of one row
export const VISIBLE = 5; // rows showing at once (odd, so there's a middle)

type Props = {
  items: (string | number)[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
  width?: number;
  format?: (item: string | number) => string;
};

export function WheelColumn({
  items,
  selectedIndex,
  onChange,
  label,
  width = 70,
  format = String,
}: Props) {
  const ref = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInit = useRef(false);

  const userScrolling = useRef(false);
  const selectedIndexRef = useRef(selectedIndex);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // The row currently in the middle, updated live while scrolling
  const [liveIndex, setLiveIndex] = useState(selectedIndex);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const scrollToIndex = useCallback((i: number, animated: boolean) => {
    ref.current?.scrollTo({ y: i * ITEM_H, animated });
  }, []);

  // Value changed from outside (a chip, or switching From/Until): move the wheel there
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    userScrolling.current = false;
    if (didInit.current) scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  // Clean up the timer if the sheet closes mid-scroll
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // Runs on every scroll frame, on web and native
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y;
    const i = clamp(Math.round(offset / ITEM_H));
    setLiveIndex(i);

    // Only a user gesture can change the value, not layout or preset scrolling.
    if (!userScrolling.current) return;

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      userScrolling.current = false;
      scrollToIndex(i, false);
      if (i !== selectedIndexRef.current) onChangeRef.current(i);
    }, 120);
  };

  const beginScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    userScrolling.current = true;
  };

  return (
    <View
      style={{ width, height: ITEM_H * VISIBLE }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(items[selectedIndex]) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
        onChange(clamp(selectedIndex + step));
      }}
    >
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={beginScroll}
        onTouchStart={beginScroll}
        {...(Platform.OS === "web"
          ? { onWheel: beginScroll, onPointerDown: beginScroll }
          : {})}
        contentContainerStyle={{
          paddingVertical: ITEM_H * Math.floor(VISIBLE / 2),
        }}
        onContentSizeChange={() => {
          // First layout: jump straight to the starting value (works on web too)
          if (!didInit.current) {
            scrollToIndex(selectedIndex, false);
            didInit.current = true;
          }
        }}
      >
        {items.map((item, i) => {
          const distance = Math.abs(i - liveIndex);
          return (
            <View key={i} style={styles.row}>
              <AppText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[
                  styles.text,
                  distance === 0 && styles.selected,
                  distance === 1 && styles.near,
                  distance >= 2 && styles.far,
                ]}
              >
                {format(item)}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ITEM_H,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  text: { fontFamily: FigtreeFont.bold },
  selected: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 30,
    color: "#15163A",
  },
  near: { fontSize: 21, color: "#8B8DA3" },
  far: { fontSize: 18, color: "#C9C7D6" },
});
