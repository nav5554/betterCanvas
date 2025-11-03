// app/components/announcements/AnnouncementsList.tsx
type Announcement = { id: number; title: string; posted_at: string | null; author_name: string | null; html_url: string | null };

export default function AnnouncementsList({ items }: { items: Announcement[] }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, textTransform:"uppercase", letterSpacing:0.3, marginBottom:6 }}>
        Announcements
      </div>
      <ul style={{ listStyle:"none", padding:0, margin:0 }}>
        {items.length === 0 && (<li style={{ fontSize: 12, opacity: 0.6 }}>None</li>)}
        {items.map((n) => (
          <li key={n.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
              {n.html_url ? (
                <a href={n.html_url} target="_blank" rel="noreferrer" style={{ color:"inherit"}}>
                  {n.title}
                </a>
              ) : n.title}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {n.posted_at ? new Date(n.posted_at).toLocaleString() : ""}
              {n.author_name ? ` • ${n.author_name}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}