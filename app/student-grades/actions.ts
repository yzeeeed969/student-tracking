"use server";
import { db } from "@/db";
import {
  students,
  quranMarks,
  homeworkMarks,
  worksheets,
  worksheetMarks,
  participation,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SURAHS } from "@/lib/surahs";
import { getSettings } from "@/lib/settings";
import { computeClassGrades } from "@/lib/grades";
import { revalidatePath } from "next/cache";

export type StudentFull = {
  id: number;
  name: string;
  classId: number;
  exams: { o1: number | null; o2: number | null; w1: number | null; w2: number | null };
  surahs: { num: number; name: string; points: number | null }[];
  homeworkCount: number;
  homework: { num: number; score: number | null }[];
  worksheets: { id: number; num: number; title: string; score: number | null }[];
  participationRaw: number;
  computed: {
    quran: number | null;
    oralWritten: number | null;
    homeworkScore: number;
    worksheetsGrade: number;
    participationGrade: number;
    total: number | null;
  };
};

export async function getStudentFull(id: number): Promise<StudentFull | null> {
  if (!id) return null;
  const [st] = await db.select().from(students).where(eq(students.id, id));
  if (!st) return null;

  const s = await getSettings();
  const homeworkCount = Number(s.homework_count ?? 18);

  const qm = await db
    .select({ surah: quranMarks.surah, points: quranMarks.points })
    .from(quranMarks)
    .where(eq(quranMarks.studentId, id));
  const qmap = new Map(qm.map((x) => [x.surah, x.points]));

  const hm = await db
    .select({ num: homeworkMarks.num, score: homeworkMarks.score })
    .from(homeworkMarks)
    .where(eq(homeworkMarks.studentId, id));
  const hmap = new Map(hm.map((x) => [x.num, x.score]));

  const sheets = await db
    .select()
    .from(worksheets)
    .where(eq(worksheets.classId, st.classId))
    .orderBy(asc(worksheets.order), asc(worksheets.num));
  const wm = await db
    .select({ worksheetId: worksheetMarks.worksheetId, score: worksheetMarks.score })
    .from(worksheetMarks)
    .where(eq(worksheetMarks.studentId, id));
  const wmap = new Map(wm.map((x) => [x.worksheetId, x.score]));

  const pt = await db
    .select({ points: participation.points })
    .from(participation)
    .where(eq(participation.studentId, id));
  const participationRaw = pt.reduce((a, x) => a + Number(x.points), 0);

  const cg = await computeClassGrades(st.classId);
  const g = cg.rows.find((r) => r.id === id);

  return {
    id: st.id,
    name: st.name,
    classId: st.classId,
    exams: { o1: st.oral1, o2: st.oral2, w1: st.written1, w2: st.written2 },
    surahs: SURAHS.map((su) => ({
      num: su.num,
      name: su.name,
      points: qmap.get(su.num) ?? null,
    })),
    homeworkCount,
    homework: Array.from({ length: homeworkCount }, (_, i) => ({
      num: i + 1,
      score: hmap.get(i + 1) ?? null,
    })),
    worksheets: sheets.map((ws) => ({
      id: ws.id,
      num: ws.num,
      title: ws.title || `الدرس ${ws.num}`,
      score: wmap.get(ws.id) ?? null,
    })),
    participationRaw,
    computed: {
      quran: g?.quran ?? null,
      oralWritten: g?.oralWritten ?? null,
      homeworkScore: g?.homeworkScore ?? 0,
      worksheetsGrade: g?.worksheetsGrade ?? 0,
      participationGrade: g?.participationGrade ?? 0,
      total: g?.total ?? null,
    },
  };
}

// إضافة/خصم نقطة مشاركة سريعة (بتاريخ اليوم) من النافذة المنبثقة
export async function addParticipationQuick(studentId: number, points: number) {
  if (!studentId || !points) return;
  await db
    .insert(participation)
    .values({ studentId, points, date: new Date() });
  revalidatePath("/record");
  revalidatePath("/participation");
  revalidatePath("/reports");
}
