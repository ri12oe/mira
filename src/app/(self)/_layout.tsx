import { NativeTabs } from "expo-router/native-tabs";

const PRIMARY = "#4338CA";

/**
 * The tabs for someone using Mira for themselves, drawn by the system like
 * the caregiver's: Liquid Glass on iOS 26, the standard iOS tab bar before
 * that, and a Material tab bar on Android. The group folder doesn't change
 * the URLs, so "/selfHome" still works.
 */
export default function SelfTabs() {
  return (
    // "never": the bar stays put while scrolling, so it's always easy to find
    <NativeTabs tintColor={PRIMARY} minimizeBehavior="never">
      <NativeTabs.Trigger name="selfHome">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="selfHistory">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "clock", selected: "clock.fill" }} md="history" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="selfPeople">
        <NativeTabs.Trigger.Label>My people</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="selfSetting">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
