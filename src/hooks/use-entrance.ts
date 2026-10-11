import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, EasingFunction } from "react-native";

/**
 * Shared animation helpers, using the curves and timings from the Mira Redesign canvas.
 *
 * Every helper returns an Animated.Value that moves between 0 and 1.
 * Turn it into opacity / translate / scale with `.interpolate(...)`.
 * Everything uses the native driver, so motion stays smooth while JS is busy.
 */

/** Things arriving on screen: fast start, gentle stop. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** A small overshoot, for Dot popping in. */
export const EASE_POP = Easing.bezier(0.34, 1.56, 0.64, 1);
/** Back-and-forth motion (floating, waving). */
export const EASE_IN_OUT = Easing.inOut(Easing.ease);

/** True when the person has turned on "Reduce motion" in their phone settings. */
export function useReduceMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}

type Options = {
  /** ms to wait before starting */
  delay?: number;
  /** ms one run takes */
  duration?: number;
  easing?: EasingFunction;
};

/**
 * Goes from 0 to 1 once, when the component appears.
 * With Reduce motion on it jumps straight to 1, so everything simply appears.
 */
export function useEntrance({ delay = 0, duration = 500, easing = EASE_OUT }: Options = {}) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReduceMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, { toValue: 1, delay, duration, easing, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, duration, easing, progress]);

  return progress;
}

/**
 * Goes from 0 to 1 over and over, forever (a pulse, a float, a wave).
 * `delay` only applies before the first run. With Reduce motion on it stays at 0.
 */
export function useLoop({ delay = 0, duration = 1000, easing = EASE_IN_OUT }: Options = {}) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReduceMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration, easing, useNativeDriver: true }));
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [reduced, delay, duration, easing, progress]);

  return progress;
}
