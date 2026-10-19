import { readPreference, writePreference } from "@/lib/preferences";

/**
 * "Bigger text" in Settings: AppText grows by this much when it's on.
 * Kept on this phone, and shared through a tiny subscribe/get pair so every
 * AppText on screen updates the moment the switch is flipped.
 */

const BIGGER_TEXT_KEY = "mira.biggerText";
const BIGGER_SCALE = 1.15;

let biggerText = readPreference(BIGGER_TEXT_KEY) === "1";
const listeners = new Set<() => void>();

export function subscribeTextScale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTextScale() {
  return biggerText ? BIGGER_SCALE : 1;
}

export function isBiggerText() {
  return biggerText;
}

export function setBiggerText(value: boolean) {
  biggerText = value;
  writePreference(BIGGER_TEXT_KEY, value ? "1" : "0");
  listeners.forEach((listener) => listener());
}
