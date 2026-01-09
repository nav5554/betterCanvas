// app/components/assignments/AssignmentsList.tsx
type Assignment = { id: number; name: string; due_at: string | null; points_possible: number | null; html_url: string | null };

export default function AssignmentsList({ items, title = "Assignments" }: { items: Assignment[]; title?: string }) {
  const accentColor = "#111827";
  const mutedColor = "rgba(17, 24, 39, 0.65)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: mutedColor,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        <span>{items.length}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.length === 0 && <li style={{ fontSize: 12, color: mutedColor }}>None</li>}
        {items.map((a) => (
          <li key={a.id} style={{ padding: "6px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
              {a.html_url ? (
                <a
                  href={a.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: accentColor, textDecoration: "none" }}
                >
                  {a.name}
                </a>
              ) : (
                <span style={{ color: accentColor }}>{a.name}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: mutedColor }}>
              {a.due_at
                ? `Due ${new Date(a.due_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "No due date"}
              {a.points_possible != null ? ` • ${a.points_possible} pts` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
