import { NextResponse } from "next/server";
import { syncCanvasData } from "@/lib/syncCanvas";

export async function POST() {
  try {
    const summary = await syncCanvasData();
    const message = `Synced ${summary.coursesSynced} courses, ${summary.assignmentsSynced} assignments, and ${summary.announcementsSynced} announcements.`;
    return NextResponse.json({ ok: true, summary, message });
  } catch (error: unknown) {
    console.error("Sync failed", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
