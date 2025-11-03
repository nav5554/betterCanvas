// lib/repo.ts
import { all, get } from "./db";

// Shared types (or import your existing ones)
export type Course = { id: number; name: string; course_code: string | null; term_name: string | null };
export type Assignment = { id: number; name: string; due_at: string | null; points_possible: number | null; html_url: string | null };
export type Announcement = { id: number; title: string; posted_at: string | null; author_name: string | null; html_url: string | null };
export type FileRow = { id: number; display_name: string | null; html_url: string | null; created_at: string | null; file_id: string | null };
type FileRowDB = {
  id: number;
  display_name: string | null;
  html_url: string | null;
  created_at: string | null;
  file_id: string | null;             // canvas_id AS file_id in your SELECT
};


export async function getCourses(): Promise<Course[]> {
  return Promise.resolve(
    all<Course>(`SELECT id, name, course_code, term_name
                 FROM courses
                 ORDER BY name COLLATE NOCASE`)
  );
}

export async function getUpcomingAssignments(courseId: number, limit = 5): Promise<Assignment[]> {
  return Promise.resolve(
    all<Assignment>(`
      SELECT id, name, due_at, points_possible, html_url
      FROM assignments
      WHERE course_id = ?
        AND due_at IS NOT NULL
        AND datetime(due_at) >= datetime('now')
      ORDER BY datetime(due_at) ASC
      LIMIT ?`,
      [courseId, limit]
    )
  );
}

export async function getRecentAnnouncements(courseId: number, limit = 5): Promise<Announcement[]> {
  return Promise.resolve(
    all<Announcement>(`
      SELECT id, title, posted_at, author_name, html_url
      FROM announcements
      WHERE course_id = ?
      ORDER BY datetime(COALESCE(posted_at, '1970-01-01')) DESC, id DESC
      LIMIT ?`,
      [courseId, limit]
    )
  );
}

export async function getAllFilesOrdered(courseId: number): Promise<FileRowDB[]> {
  return all<FileRowDB>(
    `SELECT id,
            display_name,
            html_url,
            created_at,
            file_id AS file_id
     FROM files
     WHERE course_id = ?
     ORDER BY datetime(COALESCE(created_at, '1970-01-01')) DESC, id DESC`,
    [courseId]
  );
}