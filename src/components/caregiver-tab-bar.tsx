import { AppText } from "@/components/app-test";
import ClockLargeIcon from "@/components/icons/ClockLargeIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import SunIcon from "@/components/icons/SunIcon";
import UserActivityIcon from "@/components/icons/UserActivityIcon";
import { FigtreeFont } from "@/constants/fonts";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

const PRIMARY = "#4338CA";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";

const TABS = [
  { key: "home", label: "Home", href: "/caregiverHome", Icon: HomeIcon },
  {
    key: "history",
    label: "History",
    href: "/caregiverHistory",
    Icon: ClockLargeIcon,
  },
  {
    key: "people",
    label: "People",
    href: "/caregiverPeople",
    Icon: UserActivityIcon,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/caregiverSetting",
    Icon: SunIcon,
  },
] as const;

export type CaregiverTab = (typeof TABS)[number]["key"];

export function CaregiverTabBar({ active = "home" }: { active?: CaregiverTab }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(({ key, label, href, Icon }) => (
        <Pressable
          key={key}
          style={styles.tabBarItem}
          onPress={() => {
            if (key !== active) router.replace(href);
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: key === active }}
        >
          <Icon size={24} color={key === active ? PRIMARY : SUBTITLE} />
          <AppText
            style={
              key === active ? styles.activeTabLabel : styles.inactiveTabLabel
            }
          >
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 84,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: BORDERCOLOR,
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  tabBarItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  activeTabLabel: {
    fontSize: 13,
    fontFamily: FigtreeFont.extraBold,
    color: PRIMARY,
    lineHeight: 16.9,
  },
  inactiveTabLabel: {
    fontSize: 13,
    fontFamily: FigtreeFont.extraBold,
    color: SUBTITLE,
    lineHeight: 16.9,
  },
});
