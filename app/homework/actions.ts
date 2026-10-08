"use server";
import { db } from "@/db";
import { homeworkMarks } from "@/db/schema";
import { and, eq, inArray, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// حفظ درجات واجبات طالب واحد فقط (زر الحفظ بجانب اسم الطالب)
export async function saveOneHomework(formData: FormData) {
  const studentId = Number(formData.get("saveStudentId"));
  const count = Number(formData.get("count") || 18);
  if (!studentId) return;

  const toInsert: { studentId: number; num: number; score: number }[] = [];
  for (let num = 1; num <= count; num++) {
    const raw = formData.get(`hw_${studentId}_${num}`);
    if (raw === null || String(raw).trim() === "") continue;
    toInsert.push({ studentId, num, score: Number(raw) });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(homeworkMarks)
      .where(
        and(eq(homeworkMarks.studentId, studentId), lte(homeworkMarks.num, count))
      );
    if (toInsert.length) await tx.insert(homeworkMarks).values(toInsert);
  });

  revalidatePath("/homework");
  revalidatePath("/grades");
}

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
