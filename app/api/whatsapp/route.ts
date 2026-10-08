import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, contactLogs, homeworkMarks } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { fillTemplate, waLink } from "@/lib/whatsapp";

// يسجّل الإرسال تلقائيًا ثم يحوّل إلى واتساب
export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = Number(url.searchParams.get("studentId"));
  let kind = url.searchParams.get("kind") || "عام";
  const lesson = url.searchParams.get("lesson") || "";
  const violation = url.searchParams.get("violation") || "";
  const tplIdx = url.searchParams.get("tpl"); // قالب مخصّص بالفهرس
  if (!studentId)
    return new NextResponse(null, { status: 303, headers: { Location: "/behavior" } });

  const [st] = await db.select().from(students).where(eq(students.id, studentId));
  if (!st)
    return new NextResponse(null, { status: 303, headers: { Location: "/behavior" } });

  const s = await getSettings();

  // حساب التقاويم المحلولة/غير المحلولة (خاص برسالة الواجبات)
  let solved = "";
  let unsolved = "";
  if (kind === "واجبات") {
    const count = Number(s.homework_count ?? 18);
    const classmates = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classId, st.classId));
    const cids = classmates.map((c) => c.id);
    const allMarks = cids.length
      ? await db
          .select()
          .from(homeworkMarks)
          .where(inArray(homeworkMarks.studentId, cids))
      : [];
    // أقصى تقويم تم رصده للفصل = ما تمّ تكليفه فعلًا (لتفادي عدّ تقاويم لم تُسنَد بعد)
    let assignedMax = 0;
    for (const m of allMarks)
      if (m.score != null && m.num <= count && m.num > assignedMax)
        assignedMax = m.num;
    const myMap = new Map<number, number>();
    for (const m of allMarks)
      if (m.studentId === st.id && m.score != null) myMap.set(m.num, m.score);
    const solvedNums: string[] = [];
    const unsolvedNums: string[] = [];
    for (let n = 1; n <= assignedMax; n++) {
      if (myMap.has(n))
        solvedNums.push(myMap.get(n) === 0.5 ? `${n} (جزئي)` : `${n}`);
      else unsolvedNums.push(`${n}`);
    }
    solved = solvedNums.length ? solvedNums.join("، ") : "لا يوجد";
    unsolved = unsolvedNums.length ? unsolvedNums.join("، ") : "لا يوجد";
  }

  const base = {
    student: st.name,
    subject: s.subject || "",
    teacher: s.teacher || "",
    school: s.school || "",
    date: new Date().toLocaleDateString("ar-SA-u-nu-latn"),
    lesson,
    violation,
    solved,
    unsolved,
  };

  let tpl = s.tpl_taazeez || "";
  if (tplIdx !== null) {
    // قالب مخصّص من الإعدادات
    try {
      const list = JSON.parse(s.custom_templates || "[]");
      const idx = Number(tplIdx);
      if (list[idx]?.body) {
        tpl = list[idx].body;
        kind = list[idx].label || "رسالة مخصصة";
      }
    } catch {}
  } else if (kind === "عدم الإجابة") tpl = s.tpl_homework || "";
  else if (kind === "واجبات") tpl = s.tpl_homework_status || "";
  else if (kind === "مخالفة") tpl = s.tpl_violation || "";

  const message = fillTemplate(tpl, base);

  // التوثيق التلقائي
  await db.insert(contactLogs).values({
    studentId,
    kind,
    message:
      kind === "مخالفة"
        ? violation
        : kind === "واجبات"
        ? `لم تُحل: ${unsolved}`
        : lesson || kind,
  });

  return NextResponse.redirect(waLink(st.phone, message));
}
