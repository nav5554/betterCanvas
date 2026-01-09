import { fetch } from "undici";
import { db, run, get } from "./db";

type Logger = Pick<typeof console, "log" | "warn" | "error">;

type CanvasTerm = { name?: string | null } | null | undefined;

type CanvasCourse = {
  id: number | string;
  name?: string | null;
  course_code?: string | null;
  html_url?: string | null;
  term?: CanvasTerm;
};

type CanvasAssignment = {
  id: number | string;
  name?: string | null;
  due_at?: string | null;
  lock_at?: string | null;
  unlock_at?: string | null;
  points_possible?: number | null;
  workflow_state?: string | null;
  published?: boolean;
  has_submitted_submissions?: boolean;
  html_url?: string | null;
};

type CanvasAnnouncement = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  posted_at?: string | null;
  delayed_post_at?: string | null;
  html_url?: string | null;
  author?: { display_name?: string | null; name?: string | null } | null;
  context_code?: string | null;
};

type CanvasFile = {
  id: number | string;
  display_name?: string | null;
  filename?: string | null;
  content_type?: string | null;
  size?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  url?: string | null;
  html_url?: string | null;
};

type AnnouncementOptions = {
  daysBack?: number;
  daysForward?: number;
  activeOnly?: boolean;
  latestOnly?: boolean;
  includeSections?: boolean;
};

export type SyncResult = {
  coursesSynced: number;
  assignmentsSynced: number;
  announcementsSynced: number;
};

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getCanvasBase(): string {
  const raw = need("CANVAS_BASE");
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  const u = new URL(url);
  return u.origin;
}

const BASE = getCanvasBase();
const TOKEN = need("CANVAS_TOKEN");

export function coursePathId(course: CanvasCourse): string | number {
  if (typeof course.html_url === "string") {
    const m = course.html_url.match(/\/courses\/([^/]+)/);
    if (m?.[1]) return m[1];
  }
  return course.id;
}

function contextCodeFor(course: CanvasCourse) {
  return `course_${coursePathId(course)}`;
}

function pathIdFromContextCode(contextCode: string) {
  return contextCode.replace(/^course_/, "");
}

async function* paginate<T>(url: string): AsyncGenerator<T[]> {
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) {
      const body = await r.text();
      throw new Error(`HTTP ${r.status} ${r.statusText} -> ${url}\n${body}`);
    }
    const data = (await r.json()) as T[];
    yield data;

    const link = r.headers.get("link") ?? "";
    url = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] ?? "";
  }
}

export async function listCourses(): Promise<CanvasCourse[]> {
  const u = new URL(`${BASE}/api/v1/courses`);
  u.searchParams.set("per_page", "50");
  u.searchParams.set("enrollment_state", "active");
  u.searchParams.append("include[]", "term");

  const out: CanvasCourse[] = [];
  for await (const page of paginate<CanvasCourse>(u.toString())) {
    out.push(...page);
  }

  return out.filter((course) => course.term?.name === "Fall 2025");
}

async function listAssignments(course: CanvasCourse): Promise<CanvasAssignment[]> {
  const cid = coursePathId(course);
  const u = new URL(`${BASE}/api/v1/courses/${cid}/assignments`);
  u.searchParams.set("per_page", "100");
  u.searchParams.set("order_by", "due_at");
  u.searchParams.append("include[]", "all_dates");

  const out: CanvasAssignment[] = [];
  for await (const page of paginate<CanvasAssignment>(u.toString())) out.push(...page);
  return out;
}

function incrementCoursePathId(course: CanvasCourse): CanvasCourse | null {
  const current = coursePathId(course);
  const currentStr = String(current);
  if (!/^\d+$/.test(currentStr)) return null;
  let incremented: bigint;
  try {
    incremented = BigInt(currentStr) + BigInt(1);
  } catch {
    return null;
  }
  const nextStr = incremented.toString();
  const fallbackCourse: CanvasCourse = { ...course, id: nextStr };
  if (typeof course.html_url === "string") {
    fallbackCourse.html_url = course.html_url.replace(currentStr, nextStr);
  }
  return fallbackCourse;
}

async function listAnnouncementsForCourse(
  course: CanvasCourse,
  options: AnnouncementOptions = {}
): Promise<CanvasAnnouncement[]> {
  const {
    daysBack = 14,
    daysForward = 28,
    activeOnly = true,
    latestOnly = false,
    includeSections = false,
  } = options;
  const startISO = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const endISO = new Date(Date.now() + daysForward * 24 * 60 * 60 * 1000).toISOString();

  const u = new URL(`${BASE}/api/v1/announcements`);
  u.searchParams.append("context_codes[]", contextCodeFor(course));
  u.searchParams.set("start_date", startISO);
  u.searchParams.set("end_date", endISO);
  if (activeOnly) u.searchParams.set("active_only", "true");
  if (latestOnly) u.searchParams.set("latest_only", "true");
  if (includeSections) u.searchParams.append("include[]", "sections");
  u.searchParams.set("per_page", "50");

  const out: CanvasAnnouncement[] = [];
  try {
    for await (const page of paginate<CanvasAnnouncement>(u.toString())) out.push(...page);
  } catch (err: unknown) {
    if (err instanceof Error && /(401|403|404)/.test(err.message)) {
      console.warn(`⚠️ Announcements: skipping ${course.name} (${course.id}): ${err.message}`);
      return [];
    }
    throw err;
  }
  return out;
}

function upsertCourse(c: CanvasCourse) {
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
  const row = get<{ id: number }>(`SELECT id FROM courses WHERE canvas_id = ?`, [String(canvasId)]);
  if (!row) throw new Error(`Local course not found for canvas_id=${canvasId}`);
  return row.id;
}

function upsertAssignment(localCourseId: number, a: CanvasAssignment) {
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

function upsertAnnouncement(localCourseId: number, a: CanvasAnnouncement) {
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

export function upsertFile(localCourseId: number, f: CanvasFile) {
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
      null,
      null,
    ]
  );
}

export async function syncCanvasData(logger: Logger = console): Promise<SyncResult> {
  logger.log("Canvas base:", BASE);
  logger.log("Token present:", !!TOKEN);

  const courses = await listCourses();
  logger.log(`Fetched ${courses.length} courses`);
  for (const c of courses) upsertCourse(c);

  let assignmentsSynced = 0;

  for (const c of courses) {
    const localCourseId = getLocalCourseIdByCanvasId(c.id);

    let assignments: CanvasAssignment[] | null = null;
    try {
      assignments = await listAssignments(c);
      logger.log(`→ ${c.name}: fetched ${assignments.length} assignments from API`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.warn(`⚠️ ${c.name} (${coursePathId(c)}): primary fetch failed → ${message}`);
      const fallbackCourse = incrementCoursePathId(c);
      if (!fallbackCourse) {
        logger.warn(`⚠️ ${c.name}: unable to derive fallback course id`);
        continue;
      }
      try {
        assignments = await listAssignments(fallbackCourse);
        logger.log(
          `→ ${c.name}: fallback id ${coursePathId(fallbackCourse)} fetched ${assignments.length} assignments`
        );
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : "Unknown error";
        logger.warn(`⚠️ ${c.name}: fallback fetch failed → ${fallbackMessage}`);
        continue;
      }
    }
    if (!assignments) continue;

    const insertAssignmentsTxn = db.transaction((rows: CanvasAssignment[]) => {
      for (const a of rows) upsertAssignment(localCourseId, a);
    });

    try {
      insertAssignmentsTxn(assignments);
      assignmentsSynced += assignments.length;
      logger.log(`✅ ${c.name}: saved ${assignments.length} assignments in one transaction`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error(`⛔ ${c.name}: transaction failed → ${message}`);
    }
  }

  let announcementsSynced = 0;
  for (const c of courses) {
    const localCourseId = getLocalCourseIdByCanvasId(c.id);
    const anns = await listAnnouncementsForCourse(c);
    for (const a of anns) {
      const pathId = pathIdFromContextCode(a.context_code || "");
      if (String(pathId) !== String(coursePathId(c))) continue;
      upsertAnnouncement(localCourseId, a);
      announcementsSynced++;
    }
  }
  logger.log(`✅ Saved ${announcementsSynced} announcements`);

  logger.log("✅ Synced courses + assignments → data/better_canvas.db");

  return {
    coursesSynced: courses.length,
    assignmentsSynced,
    announcementsSynced,
  };
}
