// scripts/sync.ts
import { resolve } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../.env.local") }); // load from project root

import { fetch } from "undici";
import { db, run, get } from "../lib/db";

export { coursePathId };


// ---- env + base helpers ------------------------------------------------------
function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
function getCanvasBase(): string {
  const raw = need("CANVAS_BASE"); // e.g. https://YOUR-SCHOOL.instructure.com
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  const u = new URL(url);
  return u.origin; // strip paths/trailing slashes
}
const BASE = getCanvasBase();
const TOKEN = need("CANVAS_TOKEN");

function coursePathId(course: any): string | number {
  if (typeof course?.html_url === "string") {
    const m = course.html_url.match(/\/courses\/([^/]+)/);
    if (m?.[1]) return m[1];                   // e.g. "1396~228184"
  }
  return course.id;                             // numeric on school subdomain
}

function contextCodeFor(course: any) {
  return `course_${coursePathId(course)}`;      // e.g. "course_1396~228184"
}

function pathIdFromContextCode(contextCode: string) {
  return contextCode.replace(/^course_/, "");
}

function isUpcoming(a: any) {
  // Keep if no due date (optional: flip to false if you want to skip undated)
  if (!a?.due_at) return true;

  // Canvas uses ISO UTC; SQLite uses UTC for datetime('now'), so UTC compare is fine
  const due = Date.parse(a.due_at);
  return isNaN(due) ? false : due >= Date.now();
}

// ---- pagination --------------------------------------------------------------
async function* paginate<T>(url: string): AsyncGenerator<T[]> {
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) {
      const body = await r.text();
      throw new Error(`HTTP ${r.status} ${r.statusText} -> ${url}\n${body}`);
    }
    const data = (await r.json()) as T[];
    yield data;

    // parse Link header for rel="next"
    const link = r.headers.get("link") ?? "";
    url = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] ?? "";
  }
}

// ---- Canvas fetchers ---------------------------------------------------------
export async function listCourses() {
  const u = new URL(`${BASE}/api/v1/users/self/courses`);
  u.searchParams.set("per_page", "50");
  u.searchParams.set("enrollment_state", "active");
  u.searchParams.append("include[]", "term");

  const out: any[] = [];
  for await (const page of paginate<any>(u.toString())) {
    out.push(...page);
  }

  return out.filter(course => course.term?.name === "Fall 2025");
}

async function listAssignments(course: any) {
  const cid = coursePathId(course); // <- critical
  const u = new URL(`${BASE}/api/v1/courses/${cid}/assignments`);
  u.searchParams.set("per_page", "100");
  u.searchParams.set("order_by", "due_at");
  u.searchParams.append("include[]", "all_dates");
  // no bucket: you wanted "all assignments ever"
  const out: any[] = [];
  for await (const page of paginate<any>(u.toString())) out.push(...page);
  return out;
}

async function listAnnouncementsForCourse(course: any, {
  daysBack = 14,
  daysForward = 28,
  activeOnly = true,
  latestOnly = false,
  includeSections = false,
} = {}) {
  const startISO = new Date(Date.now() - daysBack   * 24 * 60 * 60 * 1000).toISOString();
  const endISO   = new Date(Date.now() + daysForward* 24 * 60 * 60 * 1000).toISOString();

  const u = new URL(`${BASE}/api/v1/announcements`);
  u.searchParams.append("context_codes[]", contextCodeFor(course));
  u.searchParams.set("start_date", startISO);
  u.searchParams.set("end_date",   endISO);
  if (activeOnly)  u.searchParams.set("active_only",  "true");
  if (latestOnly)  u.searchParams.set("latest_only",  "true");
  if (includeSections) u.searchParams.append("include[]", "sections");
  u.searchParams.set("per_page", "50");

  const out: any[] = [];
  try {
    for await (const page of paginate<any>(u.toString())) out.push(...page);
  } catch (err: any) {
    // 401/403/404 → skip this course
    if (/(401|403|404)/.test(err.message)) {
      console.warn(`⚠️ Announcements: skipping ${course.name} (${course.id}): ${err.message}`);
      return [];
    }
    throw err;
  }
  return out; // DiscussionTopic objects with context_code
}

// ---- DB upserts (SQLite via better-sqlite3) ----------------------------------
function upsertCourse(c: any) {
  run(
    `INSERT INTO courses (canvas_id, name, course_code, term_name)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(canvas_id) DO UPDATE SET
       name=excluded.name,
       course_code=excluded.course_code,
       term_name=excluded.term_name`,
    [String(c.id), c.name ?? "(untitled)", c.course_code ?? null, c.term?.name ?? null]
  );
}

function getLocalCourseIdByCanvasId(canvasId: number | string): number {
  const row = get<{ id: number }>(
    `SELECT id FROM courses WHERE canvas_id = ?`,
    [String(canvasId)]
  );
  if (!row) throw new Error(`Local course not found for canvas_id=${canvasId}`);
  return row.id;
}


function upsertAssignment(localCourseId: number, a: any) {
  run(
    `INSERT INTO assignments
       (course_id, assignment_id, name, due_at, lock_at, unlock_at,
        points_possible, workflow_state, published, has_submitted_submissions, html_url)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       assignment_id             = excluded.assignment_id,
       due_at                    = excluded.due_at,
       lock_at                   = excluded.lock_at,
       unlock_at                 = excluded.unlock_at,
       points_possible           = excluded.points_possible,
       workflow_state            = excluded.workflow_state,
       published                 = excluded.published,
       has_submitted_submissions = excluded.has_submitted_submissions,
       html_url                  = excluded.html_url`,
    [
      localCourseId,
      String(a.id),
      a.name ?? "(untitled)",
      a.due_at ?? null,
      a.lock_at ?? null,
      a.unlock_at ?? null,
      a.points_possible ?? null,
      a.workflow_state ?? null,
      a.published ? 1 : 0,
      a.has_submitted_submissions ? 1 : 0,
      a.html_url ?? null,
    ]
  );
}

function upsertAnnouncement(localCourseId: number, a: any) {
  run(
    `INSERT INTO announcements
       (course_id, canvas_id, title, message, posted_at, html_url, author_name)
     VALUES
       (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(canvas_id) DO UPDATE SET
       course_id   = excluded.course_id,
       title       = excluded.title,
       message     = excluded.message,
       posted_at   = excluded.posted_at,
       html_url    = excluded.html_url,
       author_name = excluded.author_name`,
    [
      localCourseId,
      a.id,
      a.title ?? "(untitled)",
      a.message ?? null,
      a.posted_at ?? a.delayed_post_at ?? null,
      a.html_url ?? null,
      a.author?.display_name ?? a.author?.name ?? null,
    ]
  );
}

export function upsertFile(localCourseId: number, f: any) {
  run(
    `INSERT INTO files
       (course_id, file_id, display_name, filename, content_type, size,
        created_at, updated_at, html_url, public_url, public_url_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(file_id) DO UPDATE SET
       course_id = excluded.course_id,
       display_name = excluded.display_name,
       filename = excluded.filename,
       content_type = excluded.content_type,
       size = excluded.size,
       created_at = excluded.created_at,
       updated_at = excluded.updated_at,
       html_url = excluded.html_url`,
    [
      localCourseId,
      String(f.id),
      f.display_name ?? f.filename ?? null,
      f.filename ?? null,
      f.content_type ?? null,
      f.size ?? null,
      f.created_at ?? null,
      f.updated_at ?? null,
      f.url ?? f.html_url ?? null,
      null, // optional cache fields (unused for now)
      null,
    ]
  );
}


// ---- main --------------------------------------------------------------------
async function main() {
  console.log("Canvas base:", BASE);
  console.log("Token present:", !!TOKEN);

  // 1) Courses
  const courses = await listCourses();
  console.log(`Fetched ${courses.length} courses`);
  for (const c of courses) upsertCourse(c);

  // 2) Assignments per course
  for (const c of courses) {
  const localCourseId = getLocalCourseIdByCanvasId(c.id);

  try {
    const assignments = await listAssignments(c);
    console.log(`→ ${c.name}: fetched ${assignments.length} assignments from API`);

    let saved = 0, failed = 0;
    const insertAssignmentsTxn = db.transaction((rows: any[]) => {
  for (const a of rows) {
    upsertAssignment(localCourseId, a);
  }
});

try {
  insertAssignmentsTxn(assignments);
  console.log(`✅ ${c.name}: saved ${assignments.length} assignments in one transaction`);
} catch (err: any) {
  console.error(`⛔ ${c.name}: transaction failed → ${err.message}`);
}

    console.log(`✅ ${c.name}: saved=${saved}, failed=${failed}`);
  } catch (err: any) {
    console.warn(`⚠️ Skipping ${c.name} (${c.id}): ${err.message}`);
    continue; // move on to next course
  }
}

// 3) Announcements per course (optional)
let savedAnns = 0;
for (const c of courses) {
  const localCourseId = getLocalCourseIdByCanvasId(c.id);
  const anns = await listAnnouncementsForCourse(c);
  for (const a of anns) {
    // defensive: ensure it matches this course
    const pathId = pathIdFromContextCode(a.context_code || "");
    if (String(pathId) !== String(coursePathId(c))) continue;
    upsertAnnouncement(localCourseId, a);
    savedAnns++;
  }
}
console.log(`✅ Saved ${savedAnns} announcements`);



  console.log("✅ Synced courses + assignments → data/better_canvas.db");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});