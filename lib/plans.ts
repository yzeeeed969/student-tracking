import { db } from "@/db";
import { homeworkMarks, students } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { computeClassGrades, getClasses, type StudentGrade } from "./grades";

// حدود التصنيف بالنسبة إلى متوسط الفصل نفسه (مقارنة الطالب بزملائه)
export const WEAK_RATIO = 0.6; // أقل من 60٪ من متوسط الفصل = متعثر
export const STRONG_RATIO = 1.25; // 125٪ فأكثر من متوسط الفصل = متميز

export type Area = {
  key: "quran" | "exams" | "homework" | "worksheets" | "participation" | "reading";
  label: string;
};

export const AREAS: Record<Area["key"], string> = {
  quran: "حفظ القرآن",
  exams: "الاختبارات الشفهية والتحريرية",
  homework: "الواجبات",
  worksheets: "أوراق العمل",
  participation: "المشاركة الصفية",
  reading: "القراءة",
};

// إجراءات علاجية مقترحة لكل جانب ضعف
export const REMEDY: Record<Area["key"], string[]> = {
  quran: [
    "تسميع فردي للسور غير المحفوظة في بداية الحصة",
    "تقسيم السورة إلى مقاطع قصيرة وحفظها تدريجيًا",
    "إشراك ولي الأمر في المراجعة اليومية بالمنزل",
  ],
  exams: [
    "إعادة شرح الدروس الضعيفة بأسلوب مبسّط ووسائل حسية",
    "أسئلة شفهية قصيرة متكررة للتأكد من الفهم",
    "إعادة التقويم بعد المعالجة ومقارنة النتيجة",
  ],
  homework: [
    "متابعة حل التقاويم المتأخرة ورصدها أولًا بأول",
    "إشعار ولي الأمر عبر واتساب بالتقاويم غير المحلولة",
    "تخصيص وقت قصير داخل الحصة لإكمال الواجب",
  ],
  worksheets: [
    "إعادة حل أوراق العمل التفاعلية للدروس الضعيفة",
    "حل ورقة العمل مع المعلم خطوة بخطوة",
  ],
  participation: [
    "توجيه أسئلة مباشرة سهلة له لبناء الثقة",
    "إشراكه في عمل جماعي مع زميل متميز",
    "التعزيز الفوري عند كل مشاركة",
  ],
  reading: [
    "تدريب قرائي فردي على كلمات الدرس",
    "قراءة جهرية قصيرة يوميًا بمتابعة ولي الأمر",
  ],
};

export const ENRICH: string[] = [
  "تكليفه بقيادة مجموعة ومساعدة زملائه المتعثرين (التعلم بالأقران)",
  "أسئلة إثرائية وتحدّيات تفكير أعلى من مستوى الدرس",
  "المشاركة بعمل مميز في حائط المشاركة",
  "حفظ سور إضافية وتسميعها",
  "شهادة تميّز ورسالة تعزيز لولي الأمر",
];

export type PlanRow = {
  id: number;
  name: string;
  className: string;
  total: number;
  ratio: number; // نسبة الطالب إلى متوسط فصله (1 = يساوي المتوسط)
  level: "weak" | "mid" | "strong";
  weakAreas: Area[];
  strongAreas: Area[];
  missingHomework: number[];
};

export type ClassSummary = {
  id: number;
  name: string;
  count: number; // الطلاب الذين لهم درجات
  avg: number;
  max: number;
  min: number;
  weak: number;
  mid: number;
  strong: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function avgOf(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export async function buildPlans() {
  const classes = await getClasses();
  const rows: PlanRow[] = [];
  const summaries: ClassSummary[] = [];

  for (const cl of classes) {
    const { rows: grades } = await computeClassGrades(cl.id);
    const graded = grades.filter((g) => g.total != null);
    if (graded.length === 0) {
      summaries.push({ id: cl.id, name: cl.name, count: 0, avg: 0, max: 0, min: 0, weak: 0, mid: 0, strong: 0 });
      continue;
    }

    const ids = graded.map((g) => g.id);
    const reading = await db
      .select({ id: students.id, level: students.readingLevel })
      .from(students)
      .where(inArray(students.id, ids));
    const readingMap = new Map(reading.map((r) => [r.id, r.level]));

    // الواجبات غير المحلولة: كل واجب رُصد لأي طالب في الفصل يُعدّ مُسنَدًا
    const hw = await db
      .select({ studentId: homeworkMarks.studentId, num: homeworkMarks.num, score: homeworkMarks.score })
      .from(homeworkMarks)
      .where(inArray(homeworkMarks.studentId, ids));
    const assigned = new Set<number>();
    const solved = new Map<number, Set<number>>();
    for (const h of hw) {
      if (h.score == null) continue;
      assigned.add(h.num);
      if (h.score > 0) {
        if (!solved.has(h.studentId)) solved.set(h.studentId, new Set());
        solved.get(h.studentId)!.add(h.num);
      }
    }
    const assignedList = [...assigned].sort((a, b) => a - b);

    // متوسطات الفصل لكل جانب
    const val = (g: StudentGrade, k: Area["key"]): number => {
      switch (k) {
        case "quran": return g.quranHifz;
        case "exams": return g.oralWritten ?? 0;
        case "homework": return g.homeworkScore;
        case "worksheets": return g.worksheetAvg ?? 0;
        case "participation": return g.participationRaw;
        default: return 0;
      }
    };
    const keys: Area["key"][] = ["quran", "exams", "homework", "worksheets", "participation"];
    const areaAvg = Object.fromEntries(keys.map((k) => [k, avgOf(graded.map((g) => val(g, k)))])) as Record<string, number>;

    const totals = graded.map((g) => g.total as number);
    const avg = avgOf(totals);
    const s: ClassSummary = {
      id: cl.id, name: cl.name, count: graded.length, avg: r2(avg),
      max: r2(Math.max(...totals)), min: r2(Math.min(...totals)), weak: 0, mid: 0, strong: 0,
    };

    for (const g of graded) {
      const ratio = avg > 0 ? (g.total as number) / avg : 1;
      const level: PlanRow["level"] = ratio < WEAK_RATIO ? "weak" : ratio >= STRONG_RATIO ? "strong" : "mid";
      s[level]++;

      const weakAreas: Area[] = [];
      const strongAreas: Area[] = [];
      for (const k of keys) {
        const a = areaAvg[k];
        if (a <= 0) continue;
        const rr = val(g, k) / a;
        if (rr < WEAK_RATIO) weakAreas.push({ key: k, label: AREAS[k] });
        else if (rr >= STRONG_RATIO) strongAreas.push({ key: k, label: AREAS[k] });
      }
      if (readingMap.get(g.id) === 1) weakAreas.push({ key: "reading", label: AREAS.reading });

      const done = solved.get(g.id) ?? new Set<number>();
      rows.push({
        id: g.id,
        name: g.name,
        className: cl.name,
        total: g.total as number,
        ratio: r2(ratio),
        level,
        weakAreas,
        strongAreas,
        missingHomework: assignedList.filter((n) => !done.has(n)),
      });
    }
    summaries.push(s);
  }

  return { rows, summaries };
}
