import Database from "better-sqlite3";
import { resolve, isAbsolute, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

function resolveRelativeToRoot(p: string, root: string) {
  return isAbsolute(p) ? p : resolve(root, p);
}

function findPackageRoot(start: string): string | null {
  let current = resolve(start);
  while (true) {
    if (existsSync(resolve(current, "package.json"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function detectAppRoot(): string {
  const candidates = [
    process.env.BETTER_CANVAS_PROJECT_ROOT,
    process.env.INIT_CWD,
    process.cwd(),
    __dirname,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const root = findPackageRoot(candidate);
    if (root) return root;
  }
  return resolve(process.cwd());
}

const appRoot = detectAppRoot();

const envPath = process.env.BETTER_CANVAS_DB
  ? resolveRelativeToRoot(process.env.BETTER_CANVAS_DB, appRoot)
  : undefined;

const defaultPath = resolve(appRoot, "scripts/data/better_canvas.db");
const fallbackPath = resolve(appRoot, "data/better_canvas.db");
const dbPath =
  envPath ??
  (existsSync(defaultPath) || !existsSync(fallbackPath) ? defaultPath : fallbackPath);

const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function all<T = unknown>(sql: string, params: unknown[] = []) {
  return db.prepare(sql).all(...params) as T[];
}
export function get<T = unknown>(sql: string, params: unknown[] = []) {
  return db.prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params);
}
