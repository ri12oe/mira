import { useWindowDimensions } from "react-native";

// Phones at least this tall (iPhone 12/13/14/15 and bigger) keep the design spacing exactly.
const FULL_SIZE_HEIGHT = 780;
// Below this height, spacing is reduced only as far as the "tight" limit.
const SPACE_FLOOR_HEIGHT = 400;

/**
 * Shrinks vertical gaps and big headlines on short phones (iPhone SE and similar)
 * so the design fits. Returns the same numbers on regular and large phones.
 */
export function useScreenScale() {
  const { height } = useWindowDimensions();

  const spaceScale = Math.min(
    1,
    Math.max(0.35, (height - SPACE_FLOOR_HEIGHT) / (FULL_SIZE_HEIGHT - SPACE_FLOOR_HEIGHT)),
  );
  const fontScale = Math.min(1, Math.max(0.85, height / FULL_SIZE_HEIGHT));

  return {
    /** Scale a margin, gap or other vertical spacing. */
    space: (n: number) => n * spaceScale,
    /** Scale a large headline's font size (and its line height). */
    font: (n: number) => n * fontScale,
  };
}
