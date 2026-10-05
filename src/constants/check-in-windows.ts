/** Preset check-in windows. `start` and `end` are minutes after midnight. */
export const WINDOWS = [
  {
    id: "early",
    label: "7–9 AM",
    range: "7:00 AM – 9:00 AM",
    start: 7 * 60,
    end: 9 * 60,
  },
  {
    id: "mid",
    label: "9–11 AM",
    range: "9:00 AM – 11:00 AM",
    start: 9 * 60,
    end: 11 * 60,
  },
  {
    id: "late",
    label: "11 AM – 1 PM",
    range: "11:00 AM – 1:00 PM",
    start: 11 * 60,
    end: 13 * 60,
  },
];
