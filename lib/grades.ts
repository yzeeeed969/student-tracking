import { db } from "@/db";
import {
  students,
  homeworkMarks,
  participation,
  classRooms,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSettings, weights } from "./settings";

export type StudentGrade = {
  id: number;
  code: string;
  name: string;
  phone: string;
  guardianName: string;
  quran: number | null;
  oralWritten: number | null;
  homeworkScore: number; // مجموع الواجبات المرصودة
  homeworkDone: number; // عدد الواجبات المرصودة
  participationRaw: number; // مجموع نقاط المشاركة
  participationGrade: number; // المشاركة بعد الموازنة /وزنها
  total: number | null;
};

// يحسب درجات كل طلاب فصل معيّن، مع موازنة المشاركة داخل الفصل نفسه
export async function computeClassGrades(
  classId: number
): Promise<{ rows: StudentGrade[]; w: ReturnType<typeof weights> }> {
  const s = await getSettings();
  const w = weights(s);

  const studentRows = await db
    .select()
    .from(students)
    .where(eq(students.classId, classId))
    .orderBy(students.code);

  const ids = studentRows.map((r) => r.id);
  if (ids.length === 0) return { rows: [], w };

  // مجاميع الواجبات لكل طالب
  const hw = await db
    .select({
      studentId: homeworkMarks.studentId,
      total: sql<number>`coalesce(sum(${homeworkMarks.score}),0)`,
      cnt: sql<number>`count(${homeworkMarks.score})::int`,
    })
    .from(homeworkMarks)
    .where(
      sql`${homeworkMarks.studentId} in (${sql.join(
        ids.map((i) => sql`${i}`),
        sql`, `
      )})`
    )
    .groupBy(homeworkMarks.studentId);
  const hwMap = new Map(hw.map((r) => [r.studentId, r]));

  // مجاميع المشاركة لكل طالب
  const pt = await db
    .select({
      studentId: participation.studentId,
      total: sql<number>`coalesce(sum(${participation.points}),0)`,
    })
    .from(participation)
    .where(
      sql`${participation.studentId} in (${sql.join(
        ids.map((i) => sql`${i}`),
        sql`, `
      )})`
    )
    .groupBy(participation.studentId);
  const ptMap = new Map(pt.map((r) => [r.studentId, Number(r.total)]));

  const maxPart = Math.max(0, ...ids.map((i) => ptMap.get(i) ?? 0));

  const rows: StudentGrade[] = studentRows.map((st) => {
    const h = hwMap.get(st.id);
    const homeworkScore = Number(h?.total ?? 0);
    const homeworkDone = Number(h?.cnt ?? 0);
    const participationRaw = ptMap.get(st.id) ?? 0;
    const participationGrade =
      maxPart > 0
        ? Math.round((participationRaw / maxPart) * w.participation * 100) / 100
        : 0;

    const hasAny =
      st.quran != null ||
      st.oralWritten != null ||
      homeworkDone > 0 ||
      participationRaw > 0;

    const total = hasAny
      ? (st.quran ?? 0) +
        (st.oralWritten ?? 0) +
        homeworkScore +
        participationGrade
      : null;

    return {
      id: st.id,
      code: st.code,
      name: st.name,
      phone: st.phone,
      guardianName: st.guardianName,
      quran: st.quran,
      oralWritten: st.oralWritten,
      homeworkScore,
      homeworkDone,
      participationRaw,
      participationGrade,
      total: total == null ? null : Math.round(total * 100) / 100,
    };
  });

  return { rows, w };
}

export async function getClasses() {
  return db.select().from(classRooms).orderBy(classRooms.order);
}
