"use server";
import { db } from "@/db";
import { quranMarks, students } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SURAHS } from "@/lib/surahs";

// تطبيق مستوى سورة واحدة على مجموعة طلاب محدّدين
export async function bulkSetSurah(fd: FormData) {
  const ids = String(fd.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
  const surah = Number(fd.get("surah"));
  const raw = fd.get("points");
  const points = raw === null || String(raw).trim() === "" ? null : Number(raw);
  if (!ids.length || !surah) return;
  await db.transaction(async (tx) => {
    await tx
      .delete(quranMarks)
      .where(and(inArray(quranMarks.studentId, ids), eq(quranMarks.surah, surah)));
    if (points !== null)
      await tx
        .insert(quranMarks)
        .values(ids.map((studentId) => ({ studentId, surah, points })));
  });
  revalidatePath("/quran");
  revalidatePath("/grades");
}

export async function saveQuran(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
  if (!ids.length) return;

  const surahNums = SURAHS.map((s) => s.num);

  // اجمع درجات السور المطلوبة من النموذج
  const toInsert: { studentId: number; surah: number; points: number }[] = [];
  for (const id of ids) {
    for (const s of SURAHS) {
      const raw = formData.get(`q_${id}_${s.num}`);
      if (raw === null || String(raw).trim() === "") continue;
      toInsert.push({ studentId: id, surah: s.num, points: Number(raw) });
    }
  }

  await db.transaction(async (tx) => {
    // تلاوة المدثر 0..4 لكل طالب
    for (const id of ids) {
      const recRaw = formData.get(`rec_${id}`);
      const rec =
        recRaw === null || String(recRaw).trim() === ""
          ? null
          : Math.max(0, Math.min(4, Number(recRaw)));
      await tx.update(students).set({ recitation: rec }).where(eq(students.id, id));
    }
    // السور: احذف ثم أدرج المرصود دفعة واحدة (ذرّي)
    await tx
      .delete(quranMarks)
      .where(
        and(inArray(quranMarks.studentId, ids), inArray(quranMarks.surah, surahNums))
      );
    if (toInsert.length) await tx.insert(quranMarks).values(toInsert);
  });

  revalidatePath("/quran");
  revalidatePath("/grades");
}
