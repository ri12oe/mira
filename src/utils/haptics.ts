import * as Haptics from "expo-haptics";

// What the phone feels like when checking in, so it's clear the tap worked
// without reading the screen. Never throws: a phone without haptics (or in
// Low Power Mode) simply stays still.

/** The moment a button is pressed: a light tap */
export function feelTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** It worked (e.g. the check-in is saved): the system "success" buzz */
export function feelSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** It didn't work and a message explains why: a gentle "warning" buzz */
export function feelProblem() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}