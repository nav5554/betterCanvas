import { resolve } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../.env.local") });
import { fetch } from "undici";

const need = (k: string) => {
  const v = process.env[k]?.trim(); if (!v) throw new Error(`Missing env: ${k}`); return v;
};
const BASE = new URL((() => {
  const raw = need("CANVAS_BASE");
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  return new URL(url).origin;
})());
const TOKEN = need("CANVAS_TOKEN");

export async function* paginate<T>(url: string): AsyncGenerator<T[]> {
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText} -> ${url}`);
    const data = (await r.json()) as T[];
    yield data;
    url = /<([^>]+)>;\s*rel="next"/.exec(r.headers.get("link") ?? "")?.[1] ?? "";
  }
}

export const api = {
  courses: () => `${BASE}/api/v1/users/self/courses`,
  courseAssignments: (courseId: string|number) => `${BASE}/api/v1/courses/${courseId}/assignments`,
  courseFiles: (courseId: string|number) => `${BASE}/api/v1/courses/${courseId}/files`,
  file: (fileId: string|number) => `${BASE}/api/v1/files/${fileId}?include[]=public_url`,
};
export const authHeaders = { Authorization: `Bearer ${TOKEN}` };