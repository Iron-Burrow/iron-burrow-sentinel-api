export function EmptyState({
  title,
  detail,
  tone = "partial",
}: {
  title: string;
  detail: string;
  tone?: "partial" | "unavailable";
}) {
  return (
    <div className={`empty-state ${tone}`}>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}
