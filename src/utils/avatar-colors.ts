// Avatar colors for backup contacts, cycled by position so each person keeps the same color on every screen
const AVATAR_COLORS = [
  { background: "#DDF3EE", text: "#075E4F" }, // mint
  { background: "#FFF3D1", text: "#9A6408" }, // amber
  { background: "#E7E4FB", text: "#4338CA" }, // lilac
];

export function avatarColors(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
