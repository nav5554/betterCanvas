// app/page.tsx
import { getCourses, getUpcomingAssignments, getRecentAnnouncements, getAllFilesOrdered } from "../lib/repo";
import CourseCard from "./components/courseCard";
import { rowsToFiles } from "./components/files/utils"; // tiny helper

export default async function Page() {
  const courses = await getCourses();

  const data = await Promise.all(
    courses.map(async (c) => {
      const [assignments, announcements, materials] = await Promise.all([
        getUpcomingAssignments(c.id),
        getRecentAnnouncements(c.id),
        getAllFilesOrdered(c.id),
      ]);
      const files = await rowsToFiles(materials);
      return { course: c, assignments, announcements, files };
    })
  );

  return (
    <main style={{ background:"#fff", color:"#000", minHeight:"100vh", padding:"24px",
      fontFamily:"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.2, marginBottom: 12 }}>
        Better Canvas — Current Snapshot
      </h1>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
        {data.map((row) => (
          <CourseCard key={row.course.id} {...row} />
        ))}
      </div>
    </main>
  );
}