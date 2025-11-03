import { listCourseFiles } from "../lib/canvasFiles"; // your helper
import { get, run } from  "../lib/db";                  // you already have these
import { upsertFile } from "./sync"
import { listCourses } from "./sync";

//Import environment variables
import { resolve } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../.env.local") }); // load from project root

function getLocalCourseIdByCanvasId(canvasId: string | number) {
  const row = get<{ id: number }>(`SELECT id FROM courses WHERE canvas_id = ?`, [String(canvasId)]);
  if (!row) throw new Error(`Local course not found for canvas_id=${canvasId}`);
  return row.id;
}

async function syncFilesForCourse(course: any) {
  const localCourseId = getLocalCourseIdByCanvasId(course.id);
  const files = await listCourseFiles(course.id);       // Canvas API call
  let saved = 0;
  for (const f of files) { upsertFile(localCourseId, f); saved++; }
  console.log(`📁 ${course.name}: files API=${files.length}, saved=${saved}`);
}

async function main() {
  const courses = await listCourses(); // reuse your existing listCourses()
  for (const c of courses) {
    try { await syncFilesForCourse(c); }
    catch (e:any) { console.warn(`⚠️ Files: ${c.name} -> ${e.message}`); }
  }
  console.log("✅ Files synced");
}

main().catch(e => { console.error(e); process.exit(1); });