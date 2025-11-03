// app/components/files/utils.ts
import { getFilePublicUrl } from "../../../lib/canvasFiles";
import { createLimiter } from "../../../lib/limit";

const limitPublicUrl = createLimiter(3);

export type FileRowDB = {
  id: number;
  display_name: string | null;
  html_url: string | null;
  created_at: string | null;
  file_id: string | null;
};

export type FileView = { name: string; url: string; created_at: string | null };

export async function rowsToFiles(rows: FileRowDB[]): Promise<FileView[]> {
  return Promise.all(
    rows.map(async (r) => {
      try {
        const url = await limitPublicUrl(() => getFilePublicUrl(r.file_id ?? ""));
        return { name: r.display_name ?? "file", url, created_at: r.created_at };
      } catch {
        return { name: r.display_name ?? "file", url: r.html_url ?? "#", created_at: r.created_at };
      }
    })
  );
}