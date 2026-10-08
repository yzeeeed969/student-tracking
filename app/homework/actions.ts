"use server";
import { db } from "@/db";
import { homeworkMarks } from "@/db/schema";
import { and, inArray, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveHomework(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
  const count = Number(formData.get("count") || 18);
  if (!ids.length) return;

  // اجمع القيم المطلوبة من النموذج
  const toInsert: { studentId: number; num: number; score: number }[] = [];
  for (const id of ids) {
    for (let num = 1; num <= count; num++) {
      const raw = formData.get(`hw_${id}_${num}`);
      if (raw === null || String(raw).trim() === "") continue;
      toInsert.push({ studentId: id, num, score: Number(raw) });
    }
  }

  // عملية واحدة ذرّية: احذف درجات هؤلاء الطلاب (ضمن النطاق) ثم أدرج المرصود دفعة واحدة
  await db.transaction(async (tx) => {
    await tx
      .delete(homeworkMarks)
      .where(
        and(inArray(homeworkMarks.studentId, ids), lte(homeworkMarks.num, count))
      );
    if (toInsert.length) await tx.insert(homeworkMarks).values(toInsert);
  });

  revalidatePath("/homework");
  revalidatePath("/grades");
}
