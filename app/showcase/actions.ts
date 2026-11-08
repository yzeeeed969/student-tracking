"use server";

import { db } from "@/db";
import {
  students,
  classRooms,
  homeworkMarks,
  behaviorNotes,
  quranMarks,
  worksheets,
  worksheetMarks,
  participation,
} from "@/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
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

export type WorksheetItem = {
  num: number;
  title: string;
  url: string | null; // رابط ورقة العمل لفصل الطالب (null = لا رابط)
  score: number | null; // درجة الطالب من 10 (null = لم تُرصد)
};

// إشعار واحد لولي الأمر (مشتق من سجلّات الطالب)
export type ParentNotification = {
  kind: string; // homework | worksheet | quran | participation | exam
  icon: string; // رمز تعبيري
  message: string; // نص الإشعار
  date: string | null; // تاريخ إن وُجد (المشاركة)
};

export type ParentReport = {
  studentId: number;
  phone: string;
  name: string;
  className: string | null;
  quran: number | null;
  surahs: SurahItem[];
  homeworkScore: number;
  homeworkDone: number;
  homeworkCount: number;
  homeworkItems: HwItem[];
  exams: ExamItem[];
  worksheetsGrade: number; // درجة أوراق العمل (من وزنها، 9)
  worksheetsWeight: number; // وزن أوراق العمل (9)
  worksheetItems: WorksheetItem[]; // الأوراق المنشورة + درجة الابن
  currentHw: number; // آخر واجب رُصد في الفصل (0 = لم تبدأ)
  currentSurahIdx: number; // أبعد سورة سُمّعت في الفصل (ترتيب داخل SURAHS، -1 = لا شيء)
  participationGrade: number;
  total: number | null;
  notes: ParentNote[];
  notifications: ParentNotification[];
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
  worksheets: boolean;
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
  const worksheetsWeight = Number(s.w_worksheets ?? 9);
  const show = parentView(s);

  // أوراق العمل المنشورة (مشتركة؛ لكل درس رابطان: ثالث أول/ثاني)
  const pubSheets = show.worksheets
    ? await db
        .select()
        .from(worksheets)
        .where(eq(worksheets.published, true))
        .orderBy(asc(worksheets.order), asc(worksheets.num))
    : [];
  // تحديد الفصل الأول (ثالث أول) لاختيار الرابط المناسب
  const classesOrdered = await db
    .select({ id: classRooms.id })
    .from(classRooms)
    .orderBy(asc(classRooms.order), asc(classRooms.id));
  const firstClassId = classesOrdered[0]?.id ?? -1;

  const gradeCache = new Map<
    number,
    Awaited<ReturnType<typeof computeClassGrades>>
  >();
  // تقدّم الفصل: آخر واجب رُصد، وأبعد سورة سُمّعت (لكل فصل مرة واحدة)
  const progressCache = new Map<
    number,
    { currentHw: number; currentSurahIdx: number }
  >();

  const reports: ParentReport[] = [];
  for (const m of matches) {
    let cg = gradeCache.get(m.classId);
    if (!cg) {
      cg = await computeClassGrades(m.classId);
      gradeCache.set(m.classId, cg);
    }
    const g = cg.rows.find((r) => r.id === m.id);

    let prog = progressCache.get(m.classId);
    if (!prog) {
      const hwMaxRows = await db
        .select({ m: sql<number>`coalesce(max(${homeworkMarks.num}),0)` })
        .from(homeworkMarks)
        .innerJoin(students, eq(homeworkMarks.studentId, students.id))
        .where(eq(students.classId, m.classId));
      const currentHw = Number(hwMaxRows[0]?.m ?? 0);

      const surahRows = await db
        .selectDistinct({ surah: quranMarks.surah })
        .from(quranMarks)
        .innerJoin(students, eq(quranMarks.studentId, students.id))
        .where(eq(students.classId, m.classId));
      const idxs = surahRows
        .map((r) => SURAHS.findIndex((s) => s.num === r.surah))
        .filter((i) => i >= 0);
      const currentSurahIdx = idxs.length ? Math.max(...idxs) : -1;

      prog = { currentHw, currentSurahIdx };
      progressCache.set(m.classId, prog);
    }

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

    // أوراق العمل: درجة الابن لكل درس منشور + رابط فصله
    let worksheetItems: WorksheetItem[] = [];
    if (show.worksheets && pubSheets.length) {
      const wm = await db
        .select({
          worksheetId: worksheetMarks.worksheetId,
          score: worksheetMarks.score,
        })
        .from(worksheetMarks)
        .where(eq(worksheetMarks.studentId, m.id));
      const wmap = new Map(wm.map((x) => [x.worksheetId, x.score]));
      const isFirst = m.classId === firstClassId;
      worksheetItems = pubSheets.map((ws) => ({
        num: ws.num,
        title: ws.title || `الدرس ${ws.num}`,
        url: (isFirst ? ws.urlC1 : ws.urlC2) || null,
        score: wmap.get(ws.id) ?? null,
      }));
    }

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

    // ===== بناء إشعارات ولي الأمر (مشتقة من سجلّات الطالب) =====
    const notifications: ParentNotification[] = [];

    // المشاركة والتفاعل (لها تاريخ)
    const partRows = await db
      .select({ date: participation.date, points: participation.points })
      .from(participation)
      .where(eq(participation.studentId, m.id))
      .orderBy(desc(participation.date));
    for (const p of partRows) {
      notifications.push({
        kind: "participation",
        icon: "⭐",
        message: "أحسنت! حصلت على درجة مشاركة وتفاعل في الحصة.",
        date: fmt(p.date),
      });
    }

    // أوراق العمل المحلولة (الأحدث رقمًا أولًا)
    for (const ws of [...worksheetItems].filter((x) => x.score != null).sort((a, b) => b.num - a.num)) {
      notifications.push({
        kind: "worksheet",
        icon: "📝",
        message: `أحسنت! تم حلّ ورقة عمل «${ws.title}»، ودرجتك ${ws.score}/10.`,
        date: null,
      });
    }

    // الواجبات المستلَمة (الأحدث رقمًا أولًا)
    for (const hw of [...homeworkItems].filter((x) => x.done).sort((a, b) => b.num - a.num)) {
      notifications.push({
        kind: "homework",
        icon: "📘",
        message: `أحسنت! وصل واجبك (رقم ${hw.num}) وتم رصده.`,
        date: null,
      });
    }

    // القرآن (السور المسمَّعة، الأحدث ترتيبًا أولًا)
    for (const su of [...surahs].filter((x) => x.done).reverse()) {
      notifications.push({
        kind: "quran",
        icon: "📖",
        message: `ما شاء الله! رُصدت تلاوتك لسورة «${su.name}»${su.grade ? ` (${su.grade})` : ""}.`,
        date: null,
      });
    }

    // الاختبارات المرصودة
    for (const ex of exams.filter((x) => x.value != null)) {
      notifications.push({
        kind: "exam",
        icon: "📋",
        message: `تم رصد ${ex.label}: ${ex.value}.`,
        date: null,
      });
    }

    reports.push({
      studentId: m.id,
      phone: m.phone || "",
      name: m.name,
      className: m.className ?? null,
      quran: g?.quran ?? null,
      surahs,
      homeworkScore: g?.homeworkScore ?? 0,
      homeworkDone: g?.homeworkDone ?? 0,
      homeworkCount,
      homeworkItems,
      exams,
      worksheetsGrade: g?.worksheetsGrade ?? 0,
      worksheetsWeight,
      worksheetItems,
      currentHw: prog.currentHw,
      currentSurahIdx: prog.currentSurahIdx,
      participationGrade: g?.participationGrade ?? 0,
      total: g?.total ?? null,
      notes: notesRaw.map((n) => ({
        id: n.id,
        date: fmt(n.date),
        type: n.type,
        description: n.description,
      })),
      notifications,
      w: cg.w,
    });
  }

  return { ok: true, reports, show };
}
