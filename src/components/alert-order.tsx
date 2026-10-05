import { AppText } from "@/components/app-test";
import { DragHandle } from "@/components/drag-handle";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { FigtreeFont } from "@/constants/fonts";
import { Backup, CheckInMethod } from "@/context/caregiver-setup";
import { useState } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const LILAC = "#E7E4FB";
const SELECTED_BG = "#F1EFFD";

const CHECK_IN_METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text and Call",
  call: "Phone call",
  app: "Mira app",
};

// The caregiver is a row too, so anyone can be dragged to first.
type Row = { id: string; kind: "you" } | (Backup & { kind: "backup" });

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Props = {
  recipientName: string;
  method: CheckInMethod;
  backups: Backup[];
  onChangeBackups: (backups: Backup[]) => void;
  onEditBackup: (backup: Backup) => void;
  onAddBackup: () => void;
  /** Optional shortcut shown beside "Add another backup", e.g. reusing an existing contact */
  suggestion?: {
    label: string;
    note: string;
    avatarInitial?: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
};

function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M9.99996 4.16663V15.8333M4.16663 9.99996H15.8333"
        stroke="#2D2A8C"
        strokeWidth={1.83333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Ordered list of who gets alerted: the person first, then backups.
 * Backups can be reordered by dragging, swiped to delete, edited, or added.
 */
export function AlertOrder({
  recipientName,
  method,
  backups,
  onChangeBackups,
  onEditBackup,
  onAddBackup,
  suggestion,
  style,
}: Props) {
  const rows: Row[] = [
    { id: "you", kind: "you" },
    ...backups.map((b): Row => ({ ...b, kind: "backup" })),
  ];
  const setRows = (change: (current: Row[]) => Row[]) =>
    onChangeBackups(
      change(rows).flatMap((row) => {
        if (row.kind !== "backup") return [];
        const { kind: _kind, ...backup } = row;
        return [backup];
      }),
    );

  const [drag, setDrag] = useState<{ id: string; from: number } | null>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [dragY] = useState(() => new Animated.Value(0));
  const [rowHeight, setRowHeight] = useState(0);

  // Index 0 is the caregiver and stays pinned, so backups can only land at 1 or later.
  const targetIndex = (from: number, dy: number) =>
    Math.min(
      Math.max(Math.round(from + dy / (rowHeight || 1)), 1),
      rows.length - 1,
    );

  const startDrag = (id: string, from: number) => {
    dragY.setValue(0);
    setHoverIndex(from);
    setDrag({ id, from });
  };

  const moveDrag = (dy: number) => {
    if (!drag) return;
    // Keep the row visually inside the movable range (below the pinned caregiver, above the end).
    const h = rowHeight;
    const clamped = Math.min(
      Math.max(dy, (1 - drag.from) * h),
      (rows.length - 1 - drag.from) * h,
    );
    dragY.setValue(clamped);
    const target = targetIndex(drag.from, dy);
    if (target !== hoverIndex) setHoverIndex(target);
  };

  const endDrag = (dy: number) => {
    if (!drag) return;
    const target = targetIndex(drag.from, dy);
    setRows((current) => moveItem(current, drag.from, target));
    setDrag(null);
    dragY.setValue(0);
  };

  const nudgeRow = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 1 || to >= rows.length) return;
    setRows((current) => moveItem(current, index, to));
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.list}>
        {rows.map((row, index) => {
          const isDragging = drag?.id === row.id;
          let shift = 0;
          if (drag && !isDragging) {
            const h = rowHeight;
            if (
              drag.from < hoverIndex &&
              index > drag.from &&
              index <= hoverIndex
            )
              shift = -h;
            if (
              drag.from > hoverIndex &&
              index < drag.from &&
              index >= hoverIndex
            )
              shift = h;
          }
          const label = row.kind === "you" ? recipientName : row.name;
          const handle = (
            <DragHandle
              label={label}
              onStart={() => startDrag(row.id, index)}
              onMove={moveDrag}
              onEnd={endDrag}
              onNudge={(delta) => nudgeRow(index, delta)}
            />
          );
          const content =
            row.kind === "you" ? (
              <View style={styles.listItem}>
                <View style={styles.listOrder}>
                  <AppText style={styles.listOrderText}>{index + 1}</AppText>
                </View>
                <View style={styles.listAvatar}>
                  <AppText style={styles.listAvatarText}>
                    {recipientName.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={styles.listContent}>
                  <AppText style={styles.listContentHeader}>
                    {recipientName}
                  </AppText>
                  <AppText style={styles.listContentSubtext}>
                    {CHECK_IN_METHOD_LABELS[method]}
                  </AppText>
                </View>
                <View style={styles.pill}>
                  <AppText style={styles.pillText}>First</AppText>
                </View>
              </View>
            ) : (
              <SwipeToDelete
                label={row.name}
                onDelete={() =>
                  setRows((current) => current.filter((r) => r.id !== row.id))
                }
              >
                <View style={styles.listItem}>
                  <View style={styles.listOrder}>
                    <AppText style={styles.listOrderText}>{index + 1}</AppText>
                  </View>
                  <View style={[styles.listAvatar, styles.listAvatarBackup]}>
                    <AppText
                      style={[
                        styles.listAvatarText,
                        styles.listAvatarTextBackup,
                      ]}
                    >
                      {row.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.listContent}>
                    <AppText style={styles.listContentHeader}>
                      {row.name}
                    </AppText>
                    <AppText style={styles.listContentSubtext}>
                      {recipientName}&apos;s {row.relationship} · Backup
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => {
                      const { kind: _kind, ...backup } = row;
                      onEditBackup(backup);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${row.name}`}
                  >
                    <AppText style={styles.editButtonText}>Edit</AppText>
                  </Pressable>
                  {handle}
                </View>
              </SwipeToDelete>
            );
          return (
            <Animated.View
              key={row.id}
              onLayout={(e) => {
                setRowHeight(e.nativeEvent.layout.height);
              }}
              style={[
                styles.rowWrap,
                isDragging
                  ? [styles.rowDragging, { transform: [{ translateY: dragY }] }]
                  : { transform: [{ translateY: shift }] },
              ]}
            >
              {index > 0 && <View style={styles.divider} />}
              {content}
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.addRow}>
        <Pressable
          style={styles.addButton}
          onPress={onAddBackup}
          accessibilityRole="button"
          accessibilityLabel="Add another backup"
        >
          <PlusIcon />
          <AppText
            style={styles.addButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {suggestion ? "Add backup" : "Add another backup"}
          </AppText>
        </Pressable>
        {suggestion ? (
          <Pressable
            style={[styles.addButton, styles.suggestionButton]}
            onPress={suggestion.onPress}
            accessibilityRole="button"
            accessibilityLabel={suggestion.label}
          >
            {suggestion.avatarInitial ? (
              <View style={styles.suggestionAvatar}>
                <AppText style={styles.suggestionAvatarText}>
                  {suggestion.avatarInitial}
                </AppText>
              </View>
            ) : (
              <PlusIcon />
            )}
            <AppText
              style={styles.addButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {suggestion.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {suggestion ? (
        <AppText style={styles.suggestionNote}>{suggestion.note}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  list: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  rowWrap: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
  },
  rowDragging: {
    zIndex: 2,
    shadowColor: "#14173B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  listOrder: {
    width: 26,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  listOrderText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 15,
  },
  listAvatar: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: LILAC,
  },
  listAvatarBackup: {
    backgroundColor: MINT,
  },
  listAvatarText: {
    color: PRIMARY,
    fontSize: 19,
    fontFamily: FigtreeFont.extraBold,
  },
  listAvatarTextBackup: {
    color: GREEN,
  },
  listContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  listContentHeader: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  listContentSubtext: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.medium,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: SELECTED_BG,
  },
  pillText: {
    color: PRIMARY,
    fontSize: 13,
    fontFamily: FigtreeFont.extraBold,
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: "#EFEDF5",
  },
  editButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  addRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 10,
  },
  addButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#CFCBE3",
    borderStyle: "dashed",
    flexDirection: "row",
  },
  suggestionButton: {
    borderStyle: "solid",
    borderColor: LILAC,
    backgroundColor: LILAC,
  },
  suggestionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MINT,
  },
  suggestionAvatarText: {
    color: GREEN,
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
  },
  suggestionNote: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: FigtreeFont.semiBold,
  },
  addButtonText: {
    flexShrink: 1,
    color: PRIMARY,
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
  },
});
