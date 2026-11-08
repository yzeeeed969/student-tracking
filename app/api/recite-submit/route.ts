import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, recitations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024; // 6 ميجابايت كحدّ أقصى للتسجيل

// رفع تسجيل تسميع من صفحة الطالب العامة — بلا تسجيل دخول
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad form" }, { status: 400 });
  }

  const studentId = Math.round(Number(form.get("studentId")));
  const surah = Math.round(Number(form.get("surah")));
  const durationMs = Math.max(0, Math.round(Number(form.get("durationMs")) || 0));
  const file = form.get("audio");

  if (!Number.isInteger(studentId) || studentId <= 0)
    return NextResponse.json({ error: "bad student" }, { status: 400 });
  if (!Number.isInteger(surah) || surah < 95 || surah > 114)
    return NextResponse.json({ error: "bad surah" }, { status: 400 });
  if (!(file instanceof Blob) || file.size === 0)
    return NextResponse.json({ error: "no audio" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "too big" }, { status: 413 });

  // الطالب موجود؟
  const [stu] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId));
  if (!stu) return NextResponse.json({ error: "mismatch" }, { status: 403 });

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "audio/webm";

  // احفظ (أو استبدل) تسجيل هذا الطالب لهذه السورة
  await db
    .insert(recitations)
    .values({
      studentId,
      surah,
      audio: buf,
      mime,
      durationMs,
      bytes: buf.length,
    })
    .onConflictDoUpdate({
      target: [recitations.studentId, recitations.surah],
      set: { audio: buf, mime, durationMs, bytes: buf.length, createdAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
