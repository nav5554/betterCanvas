import { api, authHeaders, paginate } from "./canvas";



export async function listCourseFiles(courseCanvasId: string | number) {
  const u = new URL(api.courseFiles(courseCanvasId));
  u.searchParams.set("per_page", "100");
  const out: any[] = [];
  for await (const page of paginate<any>(u.toString())) out.push(...page);
  return out;
}

type CanvasFileMeta = { public_url?: string | null; url?: string | null; html_url?: string | null };

export async function getFilePublicUrl(fileId: string | number): Promise<string> {
  const r = await fetch(api.file(fileId), { headers: authHeaders as any });
  if (!r.ok) throw new Error(`files/${fileId}: HTTP ${r.status} ${r.statusText}`);
  const f = (await r.json()) as CanvasFileMeta;
  return f.public_url ?? f.url ?? f.html_url ?? "#";
}