"use server";
import { db } from "@/db";
import { students, classRooms, quranMarks, recitations } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { SURAHS } from "@/lib/surahs";

function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "").slice(-9);
}

export type ReciteSurah = {
  num: number;
  name: string;
  graded: number | null; // درجة مرصودة (points) أو null
  recorded: boolean; // يوجد تسجيل بانتظار الرصد
};

export type ReciteChild = {
  id: number;
  name: string;
  className: string;
  surahs: ReciteSurah[];
};

export type ReciteLookupState =
  | { ok: true; children: ReciteChild[] }
  | { ok: false; message: string };

export async function reciteLookup(
  _prev: ReciteLookupState | null,
  formData: FormData
): Promise<ReciteLookupState> {
  const key = normPhone(String(formData.get("phone") || ""));
  if (key.length < 9)
    return { ok: false, message: "أدخل رقم جوال صحيح (مثال: 05XXXXXXXX)." };

  const all = await db
    .select({
      id: students.id,
      name: students.name,
      phone: students.phone,
      className: classRooms.name,
    })
    .from(students)
    .leftJoin(classRooms, eq(students.classId, classRooms.id));

  const matches = all.filter((s) => normPhone(s.phone || "") === key);
  if (matches.length === 0)
    return {
      ok: false,
      message: "لا يوجد طالب مرتبط بهذا الرقم. تأكّد من الرقم أو تواصل مع المعلم.",
    };

  const ids = matches.map((m) => m.id);
  const marks = await db
    .select({ studentId: quranMarks.studentId, surah: quranMarks.surah, points: quranMarks.points })
    .from(quranMarks)
    .where(inArray(quranMarks.studentId, ids));
  const recs = await db
    .select({ studentId: recitations.studentId, surah: recitations.surah })
    .from(recitations)
    .where(inArray(recitations.studentId, ids));

  const gradedMap = new Map<string, number>();
  marks.forEach((m) => gradedMap.set(`${m.studentId}:${m.surah}`, m.points));
  const recMap = new Set<string>();
  recs.forEach((r) => recMap.add(`${r.studentId}:${r.surah}`));

  const children: ReciteChild[] = matches.map((m) => ({
    id: m.id,
    name: m.name,
    className: m.className || "",
    surahs: SURAHS.map((s) => ({
      num: s.num,
      name: s.name,
      graded: gradedMap.has(`${m.id}:${s.num}`)
        ? (gradedMap.get(`${m.id}:${s.num}`) as number)
        : null,
      recorded: recMap.has(`${m.id}:${s.num}`),
    })),
  }));

  return { ok: true, children };
}
