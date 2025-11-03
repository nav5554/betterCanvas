// app/components/assignments/AssignmentsList.tsx
type Assignment = { id: number; name: string; due_at: string | null; points_possible: number | null; html_url: string | null };

export default function AssignmentsList({ items }: { items: Assignment[] }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, textTransform:"uppercase", letterSpacing:0.3, marginBottom:6 }}>
        Upcoming Assignments
      </div>
      <ul style={{ listStyle:"none", padding:0, margin:0 }}>
        {items.length === 0 && (<li style={{ fontSize: 12, opacity: 0.6 }}>None</li>)}
        {items.map((a) => (
          <li key={a.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
              {a.html_url ? (
                <a href={a.html_url} target="_blank" rel="noreferrer" style={{ color:"inherit"}}>
                  {a.name}
                </a>
              ) : a.name}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {a.due_at ? `Due ${new Date(a.due_at).toLocaleString()}` : "No due date"}
              {a.points_possible != null ? ` • ${a.points_possible} pts` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}