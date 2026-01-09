// app/components/courseCard.tsx
import type { Course, Assignment, Announcement } from "../../lib/repo";
import AssignmentsList from "./assignments/assignmentsList";
import AnnouncementsList from "./announcements/announcementsList";
import FilesList from "./files/fileList";
import type { FileView } from "./files/utils";

type Props = {
  course: Course;
  assignments: Assignment[];
  previousAssignments: Assignment[];
  announcements: Announcement[];
  files: FileView[];
};

export default function CourseCard({ course, assignments, previousAssignments, announcements, files }: Props) {
  const borderColor = "rgba(17, 24, 39, 0.12)";
  const accentColor = "#111827";
  const sectionStyle = {
    paddingTop: 16,
    marginTop: 8,
    borderTop: `1px solid ${borderColor}`,
  };

  return (
    <section
      style={{
        padding: 18,
        borderRadius: 12,
        background: "#fff",
        border: `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        gap: 12,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: accentColor }}>{course.name}</div>
      </header>

      <div style={sectionStyle}>
        <AssignmentsList items={assignments} title="Upcoming Assignments" />
      </div>

      <div style={sectionStyle}>
        <AssignmentsList items={previousAssignments} title="Previous Assignments" />
      </div>

      <div style={sectionStyle}>
        <AnnouncementsList items={announcements} />
      </div>

      <div style={sectionStyle}>
        <FilesList files={files} initiallyCollapsed />
      </div>
    </section>
  );
}
