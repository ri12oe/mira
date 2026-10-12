// iOS/Android: expo-sqlite provides a `localStorage` that survives app restarts
import "expo-sqlite/localStorage/install";

export const authStorage = localStorage;
