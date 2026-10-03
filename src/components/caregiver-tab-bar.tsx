import { AppText } from "@/components/app-test";
import ClockLargeIcon from "@/components/icons/ClockLargeIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import SunIcon from "@/components/icons/SunIcon";
import UserActivityIcon from "@/components/icons/UserActivityIcon";
import { FigtreeFont } from "@/constants/fonts";
import { StyleSheet, View } from "react-native";

const PRIMARY = "#4338CA";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";

export function CaregiverTabBar() {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarItem}>
        <HomeIcon size={24} />
        <AppText style={styles.activeTabLabel}>Home</AppText>
      </View>
      <View style={styles.tabBarItem}>
        <ClockLargeIcon size={24} />
        <AppText style={styles.inactiveTabLabel}>Activity</AppText>
      </View>
      <View style={styles.tabBarItem}>
        <UserActivityIcon size={24} />
        <AppText style={styles.inactiveTabLabel}>Clock</AppText>
      </View>
      <View style={styles.tabBarItem}>
        <SunIcon size={24} />
        <AppText style={styles.inactiveTabLabel}>Sun</AppText>
      </View>
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
