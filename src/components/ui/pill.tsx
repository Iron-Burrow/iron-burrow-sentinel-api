export type PillTone = "healthy" | "partial" | "syncing" | "unavailable";

export function Pill({
  label,
  tone = "partial",
}: {
  label: string;
  tone?: PillTone;
}) {
  return <span className={`pill ${tone}`}>{label}</span>;
}
