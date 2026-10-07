"use server";
import { db } from "@/db";
import { quranMarks, students } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SURAHS } from "@/lib/surahs";

export async function saveQuran(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);

  for (const id of ids) {
    // تلاوة المدثر 0..4
    const recRaw = formData.get(`rec_${id}`);
    const rec =
      recRaw === null || String(recRaw).trim() === ""
        ? null
        : Math.max(0, Math.min(4, Number(recRaw)));
    await db.update(students).set({ recitation: rec }).where(eq(students.id, id));

    // السور
    for (const s of SURAHS) {
      const raw = formData.get(`q_${id}_${s.num}`);
      const points =
        raw === null || String(raw).trim() === "" ? null : Number(raw);
      const existing = await db
        .select()
        .from(quranMarks)
        .where(and(eq(quranMarks.studentId, id), eq(quranMarks.surah, s.num)));
      if (points === null) {
        if (existing.length)
          await db
            .delete(quranMarks)
            .where(
              and(eq(quranMarks.studentId, id), eq(quranMarks.surah, s.num))
            );
      } else if (existing.length) {
        await db
          .update(quranMarks)
          .set({ points })
          .where(
            and(eq(quranMarks.studentId, id), eq(quranMarks.surah, s.num))
          );
      } else {
        await db
          .insert(quranMarks)
          .values({ studentId: id, surah: s.num, points });
      }
    }
  }
  revalidatePath("/quran");
  revalidatePath("/grades");
}
