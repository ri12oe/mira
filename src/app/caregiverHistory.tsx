import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const RISE = "#8A3A12";
const GREEN = "#075E4F";
const YELLOW = "#F5B53D";
const ORANGE = "#C2551F";
const PLACEHOLDER = "#8B8DA3";
const ALERT = "#C43A2B";

export default function CaregiverHistory() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.title}>History</AppText>
          <View style={styles.chip}>
            <View style={styles.frame}>
              <AppText style={styles.chipText}>L</AppText>
            </View>
            <AppText style={styles.chipLabel}>Lin</AppText>
          </View>
        </View>
        <View style={styles.month}>
          <View style={styles.monthHeader}>
            <View style={styles.containerMonth}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M11.25 4.5L6.75 9L11.25 13.5"
                  stroke="#15163A"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <AppText style={styles.monthText}>October 2026</AppText>
            <View style={styles.containerMonth}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M6.75 4.5L11.25 9L6.75 13.5"
                  stroke="#15163A"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
          <View style={styles.calendarGrid}>
            <View style={styles.weekDays}>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>M</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>T</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>W</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>T</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>F</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>S</AppText>
              </View>
              <View style={styles.letters}>
                <AppText style={styles.lettersText}>S</AppText>
              </View>
            </View>
            <View style={styles.week}>
              <View style={styles.empty}></View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>1</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>2</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>3</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>4</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>5</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>6</AppText>
              </View>
            </View>
            <View style={styles.week}>
              <View style={styles.day}>
                <AppText style={styles.dayText}>7</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>8</AppText>
              </View>
              <View style={[styles.day, { backgroundColor: "#F5B53D" }]}>
                <AppText style={[styles.dayText, { color: INK }]}>9</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>10</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>11</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>12</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>13</AppText>
              </View>
            </View>
            <View style={styles.week}>
              <View style={styles.day}>
                <AppText style={styles.dayText}>14</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>15</AppText>
              </View>
              <View style={[styles.day, { backgroundColor: "#C43A2B" }]}>
                <AppText style={styles.dayText}>16</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>17</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>18</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>19</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>20</AppText>
              </View>
            </View>
            <View style={styles.week}>
              <View style={styles.day}>
                <AppText style={styles.dayText}>21</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>22</AppText>
              </View>
              <View style={[styles.day, { backgroundColor: "#F5B53D" }]}>
                <AppText style={[styles.dayText, { color: INK }]}>23</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>24</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>25</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>26</AppText>
              </View>
              <View style={styles.day}>
                <AppText style={styles.dayText}>27</AppText>
              </View>
            </View>
            <View style={styles.week}>
              <View
                style={[
                  styles.day,
                  {
                    borderColor: "#DCD9E8",
                    backgroundColor: "#fff",
                    borderWidth: 2,
                    borderStyle: "dashed",
                  },
                ]}
              >
                <AppText style={[styles.dayText, { color: "#8B8DA3" }]}>
                  28
                </AppText>
              </View>
              <View
                style={[
                  styles.day,
                  {
                    borderColor: "#DCD9E8",
                    backgroundColor: "#fff",
                    borderWidth: 2,
                    borderStyle: "dashed",
                  },
                ]}
              >
                <AppText style={[styles.dayText, { color: "#8B8DA3" }]}>
                  29
                </AppText>
              </View>
              <View
                style={[
                  styles.day,
                  {
                    borderColor: "#DCD9E8",
                    backgroundColor: "#fff",
                    borderWidth: 2,
                    borderStyle: "dashed",
                  },
                ]}
              >
                <AppText style={[styles.dayText, { color: "#8B8DA3" }]}>
                  30
                </AppText>
              </View>
              <View style={styles.empty}></View>
              <View style={styles.empty}></View>
              <View style={styles.empty}></View>
              <View style={styles.empty}></View>
            </View>
          </View>
          <View style={styles.totals}>
            <View style={styles.status}>
              <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <Circle cx={5} cy={5} r={5} fill="#0B7A66" />
              </Svg>
              <AppText style={styles.statusText}>24 on time</AppText>
            </View>
             <View style={styles.status}>
              <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <Circle cx={5} cy={5} r={5} fill="#F5B53D" />
              </Svg>
              <AppText style={styles.statusText}>2 late</AppText>
            </View>
             <View style={styles.status}>
              <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <Circle cx={5} cy={5} r={5} fill="#C43A2B" />
              </Svg>
              <AppText style={styles.statusText}>1 missed</AppText>
            </View>
          </View>
        </View>
      </ScrollView>
      <CaregiverTabBar active="history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: INK,
  },
  frame: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: SUN,
  },
  chipText: {
    color: RISE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
    lineHeight: 18.2,
  },
  chipLabel: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  month: {
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  monthHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  containerMonth: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: BACKGROUND,
  },
  monthText: {
    color: INK,
    fontSize: 18,
    lineHeight: 23.4,
    fontFamily: FigtreeFont.extraBold,
  },
  calendarGrid: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    alignSelf: "stretch",
  },
  weekDays: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  letters: {
    width: 36,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  lettersText: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  week: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  empty: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17,
  },
  day: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "#0B7A66",
  },
  dayText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
  totals: {
    paddingTop: 12,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDERCOLOR,
  },
  status: {
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
  },
  statusText: {
    color: INK,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
});
