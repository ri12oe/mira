export function formatTime(totalMinutes: number): string {
  const inDay = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(inDay / 60);
  const m = inDay % 60;

  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = m.toString().padStart(2, "0");

  return `${h12}:${mm} ${period}`;
}
