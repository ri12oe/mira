import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { useEffect, useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
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

  const pendingIndex = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange; // always the newest version

  // The row currently in the middle, updated live while scrolling
  const [liveIndex, setLiveIndex] = useState(selectedIndex);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const scrollToIndex = (i: number, animated: boolean) =>
    ref.current?.scrollTo({ y: i * ITEM_H, animated });

  // Value changed from outside (a chip, or switching From/Until): move the wheel there
  useEffect(() => {
    setLiveIndex(selectedIndex);
    if (didInit.current) scrollToIndex(selectedIndex, true);
  }, [selectedIndex]);

  // Clean up the timer if the sheet closes mid-scroll
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // Runs on every scroll frame, on web and native
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  const i = clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H));
  setLiveIndex(i);
  pendingIndex.current = i;

  if (settleTimer.current) clearTimeout(settleTimer.current);
  settleTimer.current = setTimeout(() => {
    scrollToIndex(i, true);
    pendingIndex.current = null;
    if (i !== selectedIndex) onChangeRef.current(i);
  }, 120);
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
  row: { height: ITEM_H, justifyContent: "center", alignItems: "center" },
  text: { fontFamily: FigtreeFont.bold },
  selected: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 30,
    color: "#15163A",
  },
  near: { fontSize: 21, color: "#8B8DA3" },
  far: { fontSize: 18, color: "#C9C7D6" },
});
