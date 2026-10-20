import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export function weights(s: Record<string, string>) {
  return {
    quran: Number(s.w_quran ?? 20),
    oralWritten: Number(s.w_oral_written ?? 40),
    homework: Number(s.w_homework ?? 18),
    participation: Number(s.w_participation ?? 13),
    worksheets: Number(s.w_worksheets ?? 9),
  };
}

// ما الذي يظهر في نافذة ولي الأمر (صفحة العرض).
// الافتراضي: القرآن والواجبات يظهران، ومن الاختبارات تحريري١ فقط، والباقي مخفي.
export function parentView(s: Record<string, string>) {
  const on = (k: string, def: boolean) => {
    const v = s[k];
    if (v === undefined || v === "") return def;
    return v === "1";
  };
  return {
    quran: on("parent_show_quran", true),
    homework: on("parent_show_homework", true),
    examW1: on("parent_show_exam_w1", true), // اختبار الفترة الأولى (تحريري ١)
    examW2: on("parent_show_exam_w2", false), // اختبار الفترة الثانية (تحريري ٢)
    examO1: on("parent_show_exam_o1", false), // الشفهي الأول
    examO2: on("parent_show_exam_o2", false), // الشفهي الثاني
    participation: on("parent_show_participation", false),
    worksheets: on("parent_show_worksheets", true),
    total: on("parent_show_total", false),
    notes: on("parent_show_notes", false),
  };
}

// مفاتيح إعدادات الظهور (تُحفظ كـ "1"/"0" في جدول الإعدادات)
export const PARENT_VIEW_KEYS = [
  "parent_show_quran",
  "parent_show_homework",
  "parent_show_exam_w1",
  "parent_show_exam_w2",
  "parent_show_exam_o1",
  "parent_show_exam_o2",
  "parent_show_participation",
  "parent_show_worksheets",
  "parent_show_total",
  "parent_show_notes",
] as const;
