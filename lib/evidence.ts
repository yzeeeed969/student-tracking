import { db } from "@/db";
import {
  students,
  contactLogs,
  behaviorNotes,
  homeworkMarks,
  homeworkSubmissions,
  worksheets,
  worksheetQuestions,
  worksheetAttempts,
  worksheetMarks,
  walls,
  wallPosts,
  quranMarks,
  participation,
  books,
  evidenceFiles,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";

// بنود تقييم الأداء الوظيفي للمعلم (النموذج الرسمي) — الأوزان مجموعها 100٪
export type EvidenceElement = {
  n: number;
  title: string;
  weight: number;
  examples: string[]; // أمثلة على تحقق البند
  required: string[]; // الشواهد المطلوبة في النموذج
  adminHeld?: string; // ما تحتفظ به الإدارة (لا يُطلب من المعلم)
};

export const ELEMENTS: EvidenceElement[] = [
  {
    n: 1,
    title: "أداء الواجبات الوظيفية",
    weight: 10,
    examples: [
      "التقيد بالدوام الرسمي",
      "تأدية الحصص وفق الجدول الدراسي",
      "المشاركة في الإشراف والمناوبة وحصص الانتظار",
      "إعداد ومتابعة الدروس والواجبات والاختبارات",
    ],
    required: [
      "سجل الدوام الرسمي",
      "سجل المناوبة والإشراف اليومي",
      "سجل الانتظار",
      "خطة توزيع المنهج",
    ],
    adminHeld:
      "سجل الدوام (حضوري) والمناوبة والإشراف والانتظار محفوظة لدى إدارة المدرسة، ولا يلزم رفعها هنا.",
  },
  {
    n: 2,
    title: "التفاعل مع المجتمع المهني",
    weight: 10,
    examples: [
      "المشاركة الفاعلة في مجتمعات التعلم المهنية",
      "تبادل الزيارات",
      "الدروس التطبيقية",
      "بحث الدرس",
      "حضور الدورات والورش التدريبية",
    ],
    required: [
      "سجل مجتمعات التعلم المهنية",
      "سجل تبادل الزيارات",
      "تقرير تنفيذ درس تطبيقي",
      "شهادات حضور الدورات والورش التدريبية",
    ],
  },
  {
    n: 3,
    title: "التفاعل مع أولياء الأمور",
    weight: 10,
    examples: [
      "التواصل الفعال مع أولياء الأمور بالتنسيق مع الموجه الطلابي",
      "تزويد أولياء الأمور بمستويات الطلاب",
      "إيصال الملاحظات الهامة لأولياء الأمور",
      "تفعيل الخطة الأسبوعية للمدرسة",
      "المشاركة الفاعلة في الجمعية العمومية",
    ],
    required: [
      "صور من الجمعية العمومية لأولياء الأمور والمعلمين",
      "تقرير اجتماع ولي الأمر مع المعلم",
      "نسخة من الخطة الأسبوعية للمدرسة",
    ],
  },
  {
    n: 4,
    title: "التنويع في استراتيجيات التدريس",
    weight: 10,
    examples: [
      "استخدام استراتيجيات متنوعة",
      "تناسب مستويات الطلاب",
      "مراعاة الفروق الفردية",
    ],
    required: ["تقرير عن تطبيق استراتيجية", "ملف إنجاز المعلم"],
  },
  {
    n: 5,
    title: "تحسين نتائج المتعلمين",
    weight: 10,
    examples: [
      "معالجة الفاقد التعليمي",
      "وضع الخطط العلاجية للطلاب الضعاف",
      "وضع الخطط الإثرائية للطلاب المتميزين",
      "تكريم الطلاب المتميزين والذين تحسّن مستواهم",
    ],
    required: ["نتائج الاختبار القبلي والبعدي", "كشف متابعة الطلاب"],
  },
  {
    n: 6,
    title: "إعداد وتنفيذ خطة التعلم",
    weight: 10,
    examples: [
      "توزيع المنهج وإعداد الدروس",
      "إعداد الواجبات والاختبارات",
      "تنفيذ الدروس",
    ],
    required: [
      "خطة توزيع المنهج",
      "نموذج من إعداد الدروس",
      "نماذج من الواجبات والاختبارات",
    ],
  },
  {
    n: 7,
    title: "توظيف تقنيات ووسائل التعلم المناسبة",
    weight: 10,
    examples: ["دمج التقنية في التعليم", "التنويع في الوسائل التعليمية"],
    required: [
      "صور من الوسائل التعليمية المستخدمة",
      "تقرير عن برنامج تقني تم استخدامه",
    ],
  },
  {
    n: 8,
    title: "تهيئة البيئة التعليمية",
    weight: 5,
    examples: [
      "مراعاة حاجات الطلاب",
      "التهيئة النفسية للطلاب",
      "التحفيز المادي والمعنوي",
      "توفير متطلبات الدرس",
    ],
    required: [
      "تقرير تصنيف الطلاب وفق أنماط التعلم",
      "نماذج من التحفيز المادي والمعنوي",
    ],
  },
  {
    n: 9,
    title: "الإدارة الصفية",
    weight: 5,
    examples: [
      "ضبط سلوك الطلاب",
      "شد انتباه الطلاب",
      "مراعاة الفروق الفردية",
      "متابعة الحضور والغياب والتأخر",
    ],
    required: ["كشف المتابعة", "تطبيق إدارة الصف"],
  },
  {
    n: 10,
    title: "تحليل نتائج المتعلمين وتشخيص مستوياتهم",
    weight: 10,
    examples: [
      "تحليل نتائج الاختبارات الفترية والنهائية",
      "تصنيف الطلاب وفق نتائجهم",
      "معالجة الفاقد التعليمي",
      "تحديد نقاط القوة والضعف",
    ],
    required: ["تقرير تحليل نتائج الطلاب", "سجل معالجة الفاقد التعليمي"],
  },
  {
    n: 11,
    title: "تنويع أساليب التقويم",
    weight: 10,
    examples: [
      "تطبيق الاختبارات الورقية والإلكترونية",
      "المشاريع الطلابية",
      "المهام الأدائية",
      "ملفات إنجاز الطلاب",
    ],
    required: [
      "نماذج من الاختبارات",
      "نماذج من ملفات إنجاز الطلاب",
      "نماذج من المهام الأدائية ومشاريع الطلاب",
    ],
  },
];

export function elementByNum(n: number) {
  return ELEMENTS.find((e) => e.n === n);
}

// شاهد تلقائي: يُستخرج من بيانات النظام نفسه، ويتحدّث وحده كلما عملت في الموقع
export type AutoEvidence = {
  title: string;
  detail: string;
  href: string;
  count: number; // 0 = لا يوجد بعد (يظهر باهتًا ولا يُحسب)
};

async function countOf(q: Promise<{ c: number }[]>) {
  const r = await q;
  return Number(r[0]?.c ?? 0);
}

// إحصاءات النظام كلها في استعلامات قليلة
export async function systemStats() {
  const c = sql<number>`count(*)::int`;
  const [
    studentsN,
    contactsN,
    violationsN,
    praiseN,
    hwMarksN,
    hwSubsN,
    wsPublishedN,
    wsQuestionsN,
    wsAttemptsN,
    wsMarksN,
    wallsN,
    wallPostsN,
    quranN,
    partN,
    booksN,
  ] = await Promise.all([
    countOf(db.select({ c }).from(students)),
    countOf(db.select({ c }).from(contactLogs)),
    countOf(
      db.select({ c }).from(behaviorNotes).where(sql`${behaviorNotes.category} <> 'تعزيز'`)
    ),
    countOf(
      db.select({ c }).from(behaviorNotes).where(eq(behaviorNotes.category, "تعزيز"))
    ),
    countOf(
      db.select({ c }).from(homeworkMarks).where(sql`${homeworkMarks.score} is not null`)
    ),
    countOf(db.select({ c }).from(homeworkSubmissions)),
    countOf(db.select({ c }).from(worksheets).where(eq(worksheets.published, true))),
    countOf(db.select({ c }).from(worksheetQuestions)),
    countOf(db.select({ c }).from(worksheetAttempts)),
    countOf(
      db.select({ c }).from(worksheetMarks).where(sql`${worksheetMarks.score} is not null`)
    ),
    countOf(db.select({ c }).from(walls)),
    countOf(db.select({ c }).from(wallPosts)),
    countOf(db.select({ c }).from(quranMarks)),
    countOf(db.select({ c }).from(participation)),
    countOf(db.select({ c }).from(books)),
  ]);

  const exams = await db
    .select({
      o1: sql<number>`count(${students.oral1})::int`,
      o2: sql<number>`count(${students.oral2})::int`,
      w1: sql<number>`count(${students.written1})::int`,
      w2: sql<number>`count(${students.written2})::int`,
      reading: sql<number>`count(*) filter (where ${students.readingLevel} > 0)::int`,
    })
    .from(students);
  const ex = exams[0] ?? { o1: 0, o2: 0, w1: 0, w2: 0, reading: 0 };

  return {
    studentsN,
    contactsN,
    violationsN,
    praiseN,
    hwMarksN,
    hwSubsN,
    wsPublishedN,
    wsQuestionsN,
    wsAttemptsN,
    wsMarksN,
    wallsN,
    wallPostsN,
    quranN,
    partN,
    booksN,
    oralN: Number(ex.o1) + Number(ex.o2),
    writtenN: Number(ex.w1) + Number(ex.w2),
    readingN: Number(ex.reading),
  };
}

export type Stats = Awaited<ReturnType<typeof systemStats>>;

// ربط كل بند بما يثبته من بيانات النظام
export function autoEvidence(
  s: Stats,
  plan: { weak: number; strong: number }
): Record<number, AutoEvidence[]> {
  const sys: AutoEvidence = {
    title: "نظام متابعة الطلاب (برنامج تقني من إعداد المعلم)",
    detail: `نظام إلكتروني لرصد الدرجات والواجبات والسلوك والتواصل مع أولياء الأمور، يخدم ${s.studentsN} طالبًا`,
    href: "/",
    count: s.studentsN > 0 ? 1 : 0,
  };
  return {
    1: [
      {
        title: "متابعة الواجبات ورصدها",
        detail: `${s.hwMarksN} رصدًا للواجبات في سجل المتابعة`,
        href: "/record?view=homework",
        count: s.hwMarksN,
      },
      {
        title: "إعداد الاختبارات ورصدها",
        detail: `${s.oralN} درجة شفهية و${s.writtenN} درجة تحريرية مرصودة`,
        href: "/record?view=exams",
        count: s.oralN + s.writtenN,
      },
    ],
    2: [],
    3: [
      {
        title: "التواصل مع أولياء الأمور عبر واتساب (توثيق تلقائي)",
        detail: `${s.contactsN} رسالة موثّقة بالتاريخ ونوع الرسالة`,
        href: "/behavior",
        count: s.contactsN,
      },
      {
        title: "نافذة ولي الأمر لمتابعة مستوى ابنه",
        detail: "صفحة عامة يُدخل فيها ولي الأمر رقم جواله فيرى تقرير ابنه، مع زر تواصل بالمعلم",
        href: "/showcase",
        count: 1,
      },
      {
        title: "أوراق العمل المنشورة لأولياء الأمور",
        detail: `${s.wsPublishedN} ورقة عمل منشورة`,
        href: "/worksheets",
        count: s.wsPublishedN,
      },
      {
        title: "رفع الواجبات من المنزل بمشاركة الأسرة",
        detail: `${s.hwSubsN} صورة واجب رفعها الطلاب وأسرهم`,
        href: "/homework-submissions",
        count: s.hwSubsN,
      },
    ],
    4: [
      {
        title: "التعلّم التشاركي — حوائط المشاركة",
        detail: `${s.wallsN} حائط، و${s.wallPostsN} مشاركة من الطلاب`,
        href: "/walls",
        count: s.wallPostsN,
      },
      {
        title: "التعلّم باللعب — البطاقات التفاعلية",
        detail: "بطاقات تفاعلية لمراجعة دروس التوحيد",
        href: "/cards",
        count: 1,
      },
      {
        title: "التعلّم الذاتي — أوراق العمل التفاعلية",
        detail: `${s.wsQuestionsN} سؤالًا تفاعليًا، و${s.wsAttemptsN} محاولة حل من الطلاب`,
        href: "/worksheets",
        count: s.wsQuestionsN,
      },
    ],
    5: [
      {
        title: "الخطة العلاجية للطلاب المتعثرين (تلقائية)",
        detail: `${plan.weak} طالبًا مشمولًا بالخطة، مع نقاط الضعف والإجراءات لكل طالب`,
        href: "/evidence/plan",
        count: plan.weak,
      },
      {
        title: "الخطة الإثرائية للطلاب المتميزين (تلقائية)",
        detail: `${plan.strong} طالبًا متميزًا مع أنشطة إثرائية`,
        href: "/evidence/plan#enrich",
        count: plan.strong,
      },
      {
        title: "تكريم الطلاب وتعزيزهم",
        detail: `${s.praiseN} تعزيزًا مسجّلًا`,
        href: "/behavior",
        count: s.praiseN,
      },
      {
        title: "كشف متابعة الطلاب",
        detail: "تقرير فردي لكل طالب بدرجاته وواجباته وملاحظاته",
        href: "/reports",
        count: s.studentsN > 0 ? 1 : 0,
      },
    ],
    6: [
      {
        title: "أوراق العمل لكل دروس المنهج",
        detail: `${s.wsPublishedN} ورقة عمل منشورة، مرتبطة بصفحات الكتاب`,
        href: "/worksheets",
        count: s.wsPublishedN,
      },
      {
        title: "الواجبات ومتابعتها",
        detail: `${s.hwMarksN} رصدًا للواجبات، و${s.hwSubsN} واجبًا مرفوعًا بالصور`,
        href: "/record?view=homework",
        count: s.hwMarksN,
      },
      {
        title: "الاختبارات الشفهية والتحريرية",
        detail: `${s.oralN + s.writtenN} درجة اختبار مرصودة`,
        href: "/record?view=exams",
        count: s.oralN + s.writtenN,
      },
    ],
    7: [
      sys,
      {
        title: "حوائط المشاركة الإلكترونية",
        detail: `${s.wallPostsN} مشاركة من الطلاب`,
        href: "/walls",
        count: s.wallPostsN,
      },
      {
        title: "البطاقات التفاعلية",
        detail: "مراجعة الدروس باللمس على الجوال",
        href: "/cards",
        count: 1,
      },
      {
        title: "أوراق العمل الإلكترونية ذاتية التصحيح",
        detail: `${s.wsAttemptsN} محاولة حل إلكترونية`,
        href: "/worksheets",
        count: s.wsQuestionsN,
      },
      {
        title: "الكتاب الرقمي والمكتبة",
        detail: `${s.booksN} كتاب رقمي داخل النظام`,
        href: "/library",
        count: s.booksN,
      },
    ],
    8: [
      {
        title: "التحفيز المعنوي — سجل التعزيز والتكريم",
        detail: `${s.praiseN} تعزيزًا، مع رسالة شكر لولي الأمر`,
        href: "/behavior",
        count: s.praiseN,
      },
      {
        title: "مراعاة حاجات الطلاب — تصنيف مستوى القراءة",
        detail: `${s.readingN} طالبًا مصنّفًا حسب مستوى القراءة`,
        href: "/students",
        count: s.readingN,
      },
    ],
    9: [
      {
        title: "ضبط السلوك — سجل الملاحظات",
        detail: `${s.violationsN} ملاحظة سلوكية موثّقة مع إبلاغ ولي الأمر`,
        href: "/behavior",
        count: s.violationsN,
      },
      {
        title: "شد الانتباه — رصد المشاركة الصفية",
        detail: `${s.partN} مشاركة مرصودة`,
        href: "/record?view=participation",
        count: s.partN,
      },
      {
        title: "كشف المتابعة",
        detail: "سجل رصد شامل لكل طالب",
        href: "/record",
        count: s.studentsN > 0 ? 1 : 0,
      },
    ],
    10: [
      {
        title: "تحليل النتائج وتصنيف الطلاب (تلقائي)",
        detail: "توزيع الطلاب إلى متميز ومتوسط ومتعثر، مع نقاط القوة والضعف",
        href: "/evidence/plan",
        count: s.studentsN > 0 ? 1 : 0,
      },
      {
        title: "رصد الدرجات من 100",
        detail: "درجات كل طالب في القرآن والاختبارات والواجبات وأوراق العمل والمشاركة",
        href: "/record",
        count: s.studentsN > 0 ? 1 : 0,
      },
      {
        title: "سجل معالجة الفاقد التعليمي",
        detail: `${plan.weak} طالبًا في الخطة العلاجية`,
        href: "/evidence/plan",
        count: plan.weak,
      },
    ],
    11: [
      {
        title: "اختبارات شفهية وتحريرية",
        detail: `${s.oralN} شفهي، ${s.writtenN} تحريري`,
        href: "/record?view=exams",
        count: s.oralN + s.writtenN,
      },
      {
        title: "تقويم إلكتروني — أوراق العمل التفاعلية",
        detail: `${s.wsMarksN} درجة ورقة عمل مرصودة`,
        href: "/record?view=worksheets",
        count: s.wsMarksN,
      },
      {
        title: "تقويم أدائي — تسميع القرآن",
        detail: `${s.quranN} تقدير لحفظ السور`,
        href: "/record?view=quran",
        count: s.quranN,
      },
      {
        title: "ملفات إنجاز الطلاب — الواجبات المرفوعة",
        detail: `${s.hwSubsN} صورة من أعمال الطلاب`,
        href: "/homework-submissions",
        count: s.hwSubsN,
      },
      {
        title: "مشاريع الطلاب — حائط المشاركة",
        detail: `${s.wallPostsN} عملًا من أعمال الطلاب`,
        href: "/walls",
        count: s.wallPostsN,
      },
    ],
  };
}

// عدد الملفات المرفوعة لكل بند
export async function fileCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({
      element: evidenceFiles.element,
      c: sql<number>`count(*)::int`,
    })
    .from(evidenceFiles)
    .groupBy(evidenceFiles.element);
  return new Map(rows.map((r) => [r.element, Number(r.c)]));
}

// حالة البند: مكتمل (3 شواهد فأكثر)، مقبول (1–2)، فارغ
export function statusOf(total: number) {
  if (total >= 3) return { label: "مكتمل", cls: "bg-emerald-100 text-emerald-800" };
  if (total >= 1) return { label: "يحتاج تقوية", cls: "bg-amber-100 text-amber-800" };
  return { label: "فارغ", cls: "bg-red-100 text-red-700" };
}
