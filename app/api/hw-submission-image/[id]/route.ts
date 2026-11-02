import { NextResponse } from "next/server";
import { db } from "@/db";
import { homeworkSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// صورة واجب مُسلّم — للمعلم المسجّل دخوله فقط (أعمال الطلاب خاصّة)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed()))
    return new NextResponse("unauthorized", { status: 401 });

  const { id } = await params;
  const [row] = await db
    .select({ image: homeworkSubmissions.image, mime: homeworkSubmissions.mime })
    .from(homeworkSubmissions)
    .where(eq(homeworkSubmissions.id, Number(id)));

  if (!row || !row.image) return new NextResponse("not found", { status: 404 });

  const data = row.image as Buffer;
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime || "image/jpeg",
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
