// app/page.tsx
import { getCourses, getUpcomingAssignments, getPreviousAssignments, getRecentAnnouncements, getAllFilesOrdered } from "../lib/repo";
import CourseCard from "./components/courseCard";
import SyncButton from "./components/syncButton";
import { rowsToFiles } from "./components/files/utils"; // tiny helper

export default async function Page() {
  const courses = await getCourses();
  const accentColor = "#111827";

  const data = await Promise.all(
    courses.map(async (c) => {
      const [assignments, previousAssignments, announcements, materials] = await Promise.all([
        getUpcomingAssignments(c.id),
        getPreviousAssignments(c.id),
        getRecentAnnouncements(c.id),
        getAllFilesOrdered(c.id),
      ]);
      const files = await rowsToFiles(materials);
      return { course: c, assignments, previousAssignments, announcements, files };
    })
  );

  return (
    <main
      style={{
        background: "#f7f7f5",
        color: "#111",
        minHeight: "100vh",
        padding: "32px 24px 64px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <div style={{ maxWidth: 1600, margin: "0 0 0 auto", paddingRight: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: 0.2, margin: 0 }}>
            Better Canvas
          </h1>
          <SyncButton accentColor={accentColor} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(280px, 1fr))`,
            gap: 18,
            alignItems: "start",
          }}
        >
          {data.map((row) => (
            <CourseCard key={row.course.id} {...row} />
          ))}
        </div>
      </div>
    </main>
  );
}
