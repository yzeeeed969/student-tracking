"use server";

import { db } from "@/db";
import {
  students,
  classRooms,
  homeworkMarks,
  behaviorNotes,
  quranMarks,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeClassGrades } from "@/lib/grades";
import { getSettings, parentView } from "@/lib/settings";
import { SURAHS } from "@/lib/surahs";
import { TAQWEEM_PAGES } from "@/lib/taqweemPages";

export type ParentNote = {
  id: number;
  date: string;
  type: string;
  description: string | null;
};

export type SurahItem = {
  num: number;
  name: string;
  done: boolean;
  grade: string | null; // ممتاز / جيد جدًا / جيد
};

export type ExamItem = { label: string; value: number | null };

export type HwItem = { num: number; done: boolean; page: number | null };

export type ParentReport = {
  name: string;
  className: string | null;
  quran: number | null;
  recitation: number | null;
  surahs: SurahItem[];
  homeworkScore: number;
  homeworkDone: number;
  homeworkCount: number;
  homeworkItems: HwItem[];
  exams: ExamItem[];
  participationGrade: number;
  total: number | null;
  notes: ParentNote[];
  w: { quran: number; oralWritten: number; homework: number; participation: number };
};

export type ParentShow = {
  quran: boolean;
  homework: boolean;
  examW1: boolean;
  examW2: boolean;
  examO1: boolean;
  examO2: boolean;
  participation: boolean;
  total: boolean;
  notes: boolean;
};

export type LookupState = {
  ok: boolean;
  message?: string;
  reports?: ParentReport[];
  show?: ParentShow;
};

const GRADE_LABEL: Record<number, string> = {
  3: "ممتاز",
  2: "جيد جدًا",
  1: "جيد",
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

  const all = await db
    .select({
      id: students.id,
      name: students.name,
      phone: students.phone,
      classId: students.classId,
      className: classRooms.name,
      oral1: students.oral1,
      oral2: students.oral2,
      written1: students.written1,
      written2: students.written2,
      recitation: students.recitation,
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
  const show = parentView(s);

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

    // الواجبات (التقاويم)
    const hwMarks = await db
      .select({ num: homeworkMarks.num })
      .from(homeworkMarks)
      .where(eq(homeworkMarks.studentId, m.id));
    const recorded = new Set(hwMarks.map((x) => x.num));
    const homeworkItems: HwItem[] = [];
    if (show.homework) {
      for (let i = 1; i <= homeworkCount; i++)
        homeworkItems.push({
          num: i,
          done: recorded.has(i),
          page: TAQWEEM_PAGES[i] ?? null,
        });
    }

    // القرآن (السور)
    let surahs: SurahItem[] = [];
    if (show.quran) {
      const qm = await db
        .select({ surah: quranMarks.surah, points: quranMarks.points })
        .from(quranMarks)
        .where(eq(quranMarks.studentId, m.id));
      const qmap = new Map(qm.map((x) => [x.surah, x.points]));
      surahs = SURAHS.map((su) => {
        const p = qmap.get(su.num);
        return {
          num: su.num,
          name: su.name,
          done: p != null,
          grade: p != null ? GRADE_LABEL[p] ?? String(p) : null,
        };
      });
    }

    // الاختبارات (حسب ما هو مُفعّل)
    const examDefs = [
      { on: show.examW1, label: "اختبار الفترة الأولى", value: m.written1 },
      { on: show.examW2, label: "اختبار الفترة الثانية", value: m.written2 },
      { on: show.examO1, label: "الاختبار الشفهي الأول", value: m.oral1 },
      { on: show.examO2, label: "الاختبار الشفهي الثاني", value: m.oral2 },
    ];
    const exams: ExamItem[] = examDefs
      .filter((e) => e.on)
      .map((e) => ({ label: e.label, value: e.value ?? null }));

    // الملاحظات (اختياري)
    const notesRaw = show.notes
      ? await db
          .select({
            id: behaviorNotes.id,
            date: behaviorNotes.date,
            type: behaviorNotes.type,
            description: behaviorNotes.description,
          })
          .from(behaviorNotes)
          .where(eq(behaviorNotes.studentId, m.id))
          .orderBy(desc(behaviorNotes.date))
          .limit(50)
      : [];

    reports.push({
      name: m.name,
      className: m.className ?? null,
      quran: g?.quran ?? null,
      recitation: m.recitation ?? null,
      surahs,
      homeworkScore: g?.homeworkScore ?? 0,
      homeworkDone: g?.homeworkDone ?? 0,
      homeworkCount,
      homeworkItems,
      exams,
      participationGrade: g?.participationGrade ?? 0,
      total: g?.total ?? null,
      notes: notesRaw.map((n) => ({
        id: n.id,
        date: fmt(n.date),
        type: n.type,
        description: n.description,
      })),
      w: cg.w,
    });
  }

  return { ok: true, reports, show };
}
