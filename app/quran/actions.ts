"use server";
import { db } from "@/db";
import { quranMarks, recitations, recitationLog } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SURAHS } from "@/lib/surahs";

// حفظ فوري لخانة سورة واحدة (عند اختيار مستوى من القائمة المنسدلة)
export async function setQuranCell(
  studentId: number,
  surah: number,
  value: string
) {
  if (!studentId || !surah) return;
  if (value === "" || value == null) {
    await db
      .delete(quranMarks)
      .where(
        and(eq(quranMarks.studentId, studentId), eq(quranMarks.surah, surah))
      );
  } else {
    const points = Number(value);
    await db
      .insert(quranMarks)
      .values({ studentId, surah, points })
      .onConflictDoUpdate({
        target: [quranMarks.studentId, quranMarks.surah],
        set: { points },
      });
    // حُذف التسجيل الصوتي بعد رصد الدرجة (لتوفير المساحة) + تسجيله في الأرشيف
    const removed = await db
      .delete(recitations)
      .where(
        and(eq(recitations.studentId, studentId), eq(recitations.surah, surah))
      )
      .returning({ id: recitations.id });
    if (removed.length) {
      await db
        .insert(recitationLog)
        .values({ studentId, surah, grade: points });
    }
  }
  revalidatePath("/record");
  revalidatePath("/reports");
  revalidatePath("/recitations");
}

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
  // حذف التسجيلات بعد رصد الدرجة + أرشفتها
  if (points !== null) {
    const removed = await db
      .delete(recitations)
      .where(
        and(inArray(recitations.studentId, ids), eq(recitations.surah, surah))
      )
      .returning({ studentId: recitations.studentId });
    if (removed.length)
      await db.insert(recitationLog).values(
        removed.map((r) => ({ studentId: r.studentId, surah, grade: points }))
      );
  }
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
    // السور: احذف ثم أدرج المرصود دفعة واحدة (ذرّي)
    await tx
      .delete(quranMarks)
      .where(
        and(inArray(quranMarks.studentId, ids), inArray(quranMarks.surah, surahNums))
      );
    if (toInsert.length) await tx.insert(quranMarks).values(toInsert);
  });

  // حذف التسجيلات للسور التي رُصدت درجاتها + أرشفتها
  for (const r of toInsert) {
    const removed = await db
      .delete(recitations)
      .where(
        and(
          eq(recitations.studentId, r.studentId),
          eq(recitations.surah, r.surah)
        )
      )
      .returning({ id: recitations.id });
    if (removed.length)
      await db
        .insert(recitationLog)
        .values({ studentId: r.studentId, surah: r.surah, grade: r.points });
  }

  revalidatePath("/quran");
  revalidatePath("/grades");
}
