// scripts/init-db.ts
import { db } from "../lib/db";

// Safety first
db.pragma("foreign_keys = ON");

// ----- wipe (comment these out if you want to preserve data) -----
db.exec(`
  DROP TABLE IF EXISTS sync_state;
  DROP TABLE IF EXISTS files;
  DROP TABLE IF EXISTS folders;
  DROP TABLE IF EXISTS announcements;
  DROP TABLE IF EXISTS assignments;
  DROP TABLE IF EXISTS courses;
`);

// ----- schema ----------------------------------------------------
db.exec(`
/* Courses: store Canvas course id as TEXT (works for numeric or "1396~...") */
CREATE TABLE courses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  canvas_id    TEXT UNIQUE NOT NULL,
  name         TEXT,
  course_code  TEXT,
  term_name    TEXT
);

/* Assignments: 
   - Strong uniqueness by Canvas assignment_id
   - Also add a normalized-name key per course so "replace on same name" works
*/
CREATE TABLE assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  assignment_id TEXT,
  name TEXT NOT NULL UNIQUE,           -- 🔹 globally unique by name only
  due_at TEXT,
  lock_at TEXT,
  unlock_at TEXT,
  points_possible REAL,
  workflow_state TEXT,
  published INTEGER,
  has_submitted_submissions INTEGER,
  html_url TEXT,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

/* Announcements */
CREATE TABLE announcements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id   INTEGER NOT NULL,
  canvas_id   TEXT UNIQUE NOT NULL,     -- Canvas discussion/announcement id
  title       TEXT NOT NULL,
  message     TEXT,
  posted_at   TEXT,                     -- ISO 8601
  html_url    TEXT,
  author_name TEXT,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

/* Folders (optional but helpful for files) */
CREATE TABLE folders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER NOT NULL,
  folder_id     TEXT UNIQUE NOT NULL,   -- Canvas folder id (TEXT)
  name          TEXT,
  parent_id     TEXT,                   -- Canvas parent folder id (TEXT)
  full_name     TEXT,                   -- Canvas "full_name" if provided
  created_at    TEXT,
  updated_at    TEXT,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

/* Files */
CREATE TABLE files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER NOT NULL,
  file_id       TEXT UNIQUE NOT NULL,   -- Canvas file id (TEXT)
  folder_id     TEXT,                   -- Canvas folder id (TEXT)
  display_name  TEXT,
  filename      TEXT,
  content_type  TEXT,
  size          INTEGER,
  created_at    TEXT,
  updated_at    TEXT,
  html_url      TEXT,                   -- Canvas web URL
  public_url    TEXT,                   -- cached when available
  public_url_expires_at TEXT,           -- optional TTL if you decide to track
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

/* Sync state (cursors, last-run timestamps, etc.) */
CREATE TABLE sync_state (
  key   TEXT PRIMARY KEY,
  value TEXT
);

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_courses_canvas_id        ON courses(canvas_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course       ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at       ON assignments(due_at);
CREATE INDEX IF NOT EXISTS idx_announcements_course     ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_files_course             ON files(course_id);
CREATE INDEX IF NOT EXISTS idx_files_folder             ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_course           ON folders(course_id);
`);

console.log("✅ Fresh schema ready: data/better_canvas.db");