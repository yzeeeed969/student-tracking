import { NextResponse } from "next/server";
import { db } from "@/db";
import { classRooms, students, homeworkMarks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";
import { normalizePhone } from "@/lib/whatsapp";

type Row = {
  code?: string;
  name: string;
  class: string;
  guardian?: string;
  phone?: string;
  quran?: number | null;
  oral_written?: number | null;
  homework?: (number | null)[];
};

export async function POST(req: Request) {
  if (!(await isAuthed()))
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/login" },
    });

  const redirectTo = (path: string) =>
    new NextResponse(null, { status: 303, headers: { Location: path } });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return redirectTo("/import?e=nofile");

  let rows: Row[];
  try {
    rows = JSON.parse(await file.text());
    if (!Array.isArray(rows)) throw new Error("not array");
  } catch {
    return redirectTo("/import?e=badjson");
  }

  // الفصول
  const classNames = Array.from(new Set(rows.map((r) => r.class).filter(Boolean)));
  const classMap = new Map<string, number>();
  for (let i = 0; i < classNames.length; i++) {
    const name = classNames[i];
    const ex = await db.select().from(classRooms).where(eq(classRooms.name, name));
    if (ex.length) classMap.set(name, ex[0].id);
    else {
      const [c] = await db
        .insert(classRooms)
        .values({ name, order: i })
        .returning();
      classMap.set(name, c.id);
    }
  }

  const counters: Record<string, number> = {};
  let added = 0;
  for (const r of rows) {
    if (!r.name || !r.class) continue;
    const classId = classMap.get(r.class)!;
    const prefix = r.class.includes("2") ? "2" : "1";
    counters[r.class] = (counters[r.class] ?? 0) + 1;
    const code = r.code || `${prefix}-${String(counters[r.class]).padStart(2, "0")}`;

    const [stu] = await db
      .insert(students)
      .values({
        code,
        name: r.name,
        classId,
        guardianName: r.guardian || "",
        phone: normalizePhone(r.phone || ""),
        quran: r.quran ?? null,
        oralWritten: r.oral_written ?? null,
      })
      .onConflictDoNothing({ target: students.code })
      .returning();
    if (!stu) continue;
    added++;

    const marks = (r.homework || [])
      .map((score, idx) => ({ studentId: stu.id, num: idx + 1, score }))
      .filter((m) => m.score !== null && m.score !== undefined);
    if (marks.length) await db.insert(homeworkMarks).values(marks);
  }

  return redirectTo(`/students?imported=${added}`);
}
