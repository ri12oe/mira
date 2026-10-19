import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  HistoryEntry,
  getMonthTotals,
  monthLabel,
} from "@/utils/check-in-history";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const MINT = "#DDF3EE";
const CALM = "#134A40";
const TEAL = "#157A66";

type Props = {
  entries: Map<string, HistoryEntry>;
  year: number;
  month: number;
  /** The month being viewed is the current one, so it reads "this month" */
  isCurrentMonth: boolean;
};

/** "26 of 27 days": how many of the days that have passed this month were checked in. */
export function MonthSummaryCard({ entries, year, month, isCurrentMonth }: Props) {
  const totals = getMonthTotals(entries, year, month);
  const checkedIn = totals.onTime + totals.late;
  const counted = checkedIn + totals.missed;
  const when = isCurrentMonth ? "this month" : `in ${monthLabel(year, month).split(" ")[0]}`;

  const title = counted === 0 ? "No days yet" : `${checkedIn} of ${counted} days`;
  const line =
    counted === 0
      ? `Nothing to count ${when} yet.`
      : `You checked in ${when}.`;
  const note = counted > 0 && checkedIn === counted ? "Nice work." : null;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={[title, line, note].filter(Boolean).join(". ")}
    >
      <View style={styles.badge}>
        <View style={styles.badgeInner}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path
              d="M5 11.5L9.5 16L17 7"
              stroke="#fff"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
      <View style={styles.text}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.line}>{line}</AppText>
        {note && <AppText style={styles.line}>{note}</AppText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    alignSelf: "stretch",
    borderRadius: 28,
    backgroundColor: MINT,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  line: {
    color: CALM,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 17,
    lineHeight: 24,
  },
});
