import Database from "better-sqlite3";
import { resolve } from "node:path";

export const db = new Database(resolve(process.cwd(), "scripts/data/better_canvas.db"));

export function all<T = any>(sql: string, params: any[] = []) {
  return db.prepare(sql).all(...params) as T[];
}
export function get<T = any>(sql: string, params: any[] = []) {
  return db.prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, params: any[] = []) {
  return db.prepare(sql).run(...params);
}

