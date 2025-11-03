// app/components/courseCard.tsx
import AssignmentsList from "./assignments/assignmentsList";
import AnnouncementsList from "./announcements/announcementsList";
import FilesList from "./files/fileList";

export default function CourseCard({ course, assignments, announcements, files }: any) {
  const dividerStyle = {
    height: "1px",
    background: "rgba(0, 0, 0, 0.79)",
    margin: "10px 0",
    border: "none",
  };

  return (
    <section
      style={{
        padding: 12,
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <header style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{course.name}</div>
      </header>

      <hr style={{ border: "none", borderTop: "1px solid #2b2b2bff", margin: "10px 0" }} />

      <AssignmentsList items={assignments} />

      <hr style={{ border: "none", borderTop: "1px solid #2b2b2bff", margin: "10px 0" }} />

      <AnnouncementsList items={announcements} />

      <hr style={{ border: "none", borderTop: "1px solid #2b2b2bff", margin: "10px 0" }} />

      <FilesList files={files} initiallyCollapsed />
    </section>
  );
}