import { NextResponse } from "next/server";
import { db } from "@/db";
import { evidenceFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";

// عرض ملف شاهد (للمعلم فقط)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) return new NextResponse("unauthorized", { status: 401 });
  const { id } = await params;
  const [f] = await db.select().from(evidenceFiles).where(eq(evidenceFiles.id, Number(id)));
  if (!f) return new NextResponse("not found", { status: 404 });
  const data = f.data as Buffer;
  const download = new URL(req.url).searchParams.get("dl") === "1";
  const ext = f.mime === "application/pdf" ? ".pdf" : f.mime.startsWith("image/") ? "." + f.mime.split("/")[1].replace("jpeg", "jpg") : "";
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(f.title + ext)}`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
