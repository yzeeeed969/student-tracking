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
    participation: Number(s.w_participation ?? 22),
  };
}

// ما الذي يظهر في نافذة ولي الأمر (صفحة العرض). الافتراضي: الدرجات تظهر والملاحظات مخفية.
export function parentView(s: Record<string, string>) {
  const on = (k: string, def: boolean) => {
    const v = s[k];
    if (v === undefined || v === "") return def;
    return v === "1";
  };
  return {
    quran: on("parent_show_quran", true),
    oral: on("parent_show_oral", true),
    homework: on("parent_show_homework", true),
    participation: on("parent_show_participation", true),
    total: on("parent_show_total", true),
    notes: on("parent_show_notes", false),
  };
}

// مفاتيح إعدادات الظهور (تُحفظ كـ "1"/"0" في جدول الإعدادات)
export const PARENT_VIEW_KEYS = [
  "parent_show_quran",
  "parent_show_oral",
  "parent_show_homework",
  "parent_show_participation",
  "parent_show_total",
  "parent_show_notes",
] as const;
