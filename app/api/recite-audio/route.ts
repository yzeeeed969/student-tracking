import { db } from "@/db";
import { recitations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// بثّ تسجيل التسميع للمعلم (محميّ عبر middleware — يتطلّب تسجيل دخول)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = Math.round(Number(url.searchParams.get("studentId")));
  const surah = Math.round(Number(url.searchParams.get("surah")));
  if (!studentId || !surah) return new Response("bad request", { status: 400 });

  const [rec] = await db
    .select({ audio: recitations.audio, mime: recitations.mime })
    .from(recitations)
    .where(
      and(eq(recitations.studentId, studentId), eq(recitations.surah, surah))
    );
  if (!rec) return new Response("not found", { status: 404 });

  const body = new Uint8Array(rec.audio);
  return new Response(body, {
    headers: {
      "content-type": rec.mime || "audio/webm",
      "cache-control": "no-store",
    },
  });
}
