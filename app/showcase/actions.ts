"use server";

import { db } from "@/db";
import { students, classRooms, homeworkMarks, behaviorNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeClassGrades } from "@/lib/grades";
import { getSettings } from "@/lib/settings";

export type ParentNote = {
  id: number;
  date: string;
  type: string;
  description: string | null;
};

export type ParentReport = {
  name: string;
  className: string | null;
  quran: number | null;
  oralWritten: number | null;
  homeworkScore: number;
  participationGrade: number;
  total: number | null;
  homeworkDone: number;
  homeworkCount: number;
  missing: number[];
  notes: ParentNote[];
  w: { quran: number; oralWritten: number; homework: number; participation: number };
};

export type LookupState = {
  ok: boolean;
  message?: string;
  reports?: ParentReport[];
};

// يُبقي آخر 9 أرقام فقط (يتجاهل 966 أو الصفر الأول والمسافات)
function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "").slice(-9);
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ar-SA-u-nu-latn");
}

export async function lookupParent(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
  const raw = String(formData.get("phone") || "");
  const key = normPhone(raw);

  if (key.length < 9) {
    return { ok: false, message: "أدخل رقم جوال صحيح (مثال: 05XXXXXXXX)." };
  }

  // كل الطلاب مع أسماء الفصول (العدد صغير، فالمطابقة في الذاكرة آمنة)
  const all = await db
    .select({
      id: students.id,
      name: students.name,
      phone: students.phone,
      classId: students.classId,
      className: classRooms.name,
    })
    .from(students)
    .leftJoin(classRooms, eq(students.classId, classRooms.id));

  const matches = all.filter((s) => normPhone(s.phone || "") === key);

  if (matches.length === 0) {
    return {
      ok: false,
      message: "لا يوجد طالب مرتبط بهذا الرقم. تأكّد من الرقم أو تواصل مع المعلم.",
    };
  }

  const s = await getSettings();
  const homeworkCount = Number(s.homework_count ?? 18);

  // نحسب درجات الفصل مرة واحدة لكل فصل
  const gradeCache = new Map<
    number,
    Awaited<ReturnType<typeof computeClassGrades>>
  >();

  const reports: ParentReport[] = [];
  for (const m of matches) {
    let cg = gradeCache.get(m.classId);
    if (!cg) {
      cg = await computeClassGrades(m.classId);
      gradeCache.set(m.classId, cg);
    }
    const g = cg.rows.find((r) => r.id === m.id);

    const marks = await db
      .select({ num: homeworkMarks.num })
      .from(homeworkMarks)
      .where(eq(homeworkMarks.studentId, m.id));
    const recorded = new Set(marks.map((x) => x.num));
    const missing: number[] = [];
    for (let i = 1; i <= homeworkCount; i++)
      if (!recorded.has(i)) missing.push(i);

    const notesRaw = await db
      .select({
        id: behaviorNotes.id,
        date: behaviorNotes.date,
        type: behaviorNotes.type,
        description: behaviorNotes.description,
      })
      .from(behaviorNotes)
      .where(eq(behaviorNotes.studentId, m.id))
      .orderBy(desc(behaviorNotes.date))
      .limit(50);

    reports.push({
      name: m.name,
      className: m.className ?? null,
      quran: g?.quran ?? null,
      oralWritten: g?.oralWritten ?? null,
      homeworkScore: g?.homeworkScore ?? 0,
      participationGrade: g?.participationGrade ?? 0,
      total: g?.total ?? null,
      homeworkDone: g?.homeworkDone ?? 0,
      homeworkCount,
      missing,
      notes: notesRaw.map((n) => ({
        id: n.id,
        date: fmt(n.date),
        type: n.type,
        description: n.description,
      })),
      w: cg.w,
    });
  }

  return { ok: true, reports };
}
