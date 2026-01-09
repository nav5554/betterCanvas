// app/components/announcements/AnnouncementsList.tsx
type Announcement = { id: number; title: string; posted_at: string | null; author_name: string | null; html_url: string | null };

export default function AnnouncementsList({ items }: { items: Announcement[] }) {
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
        <span>Announcements</span>
        <span>{items.length}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.length === 0 && <li style={{ fontSize: 12, color: mutedColor }}>None</li>}
        {items.map((n) => (
          <li key={n.id} style={{ padding: "6px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
              {n.html_url ? (
                <a
                  href={n.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: accentColor, textDecoration: "none" }}
                >
                  {n.title}
                </a>
              ) : (
                <span style={{ color: accentColor }}>{n.title}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: mutedColor }}>
              {n.posted_at ? new Date(n.posted_at).toLocaleString() : ""}
              {n.author_name ? ` • ${n.author_name}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
