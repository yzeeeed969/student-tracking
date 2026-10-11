"use server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function num(fd: FormData, key: string): number | null {
  const raw = fd.get(key);
  if (raw === null || String(raw).trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fields(fd: FormData, id: number) {
  return {
    oral1: num(fd, `o1_${id}`),
    oral2: num(fd, `o2_${id}`),
    written1: num(fd, `w1_${id}`),
    written2: num(fd, `w2_${id}`),
  };
}

// حفظ اختبارات طالب واحد (زر الحفظ بجانب الاسم)
export async function saveOneExam(studentId: number, fd: FormData) {
  if (!studentId) return;
  await db.update(students).set(fields(fd, studentId)).where(eq(students.id, studentId));
  revalidatePath("/record");
  revalidatePath("/exams");
  revalidatePath("/reports");
}

// حفظ اختبارات كل الطلاب المعروضين
export async function saveExams(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
  if (!ids.length) return;
  await db.transaction(async (tx) => {
    for (const id of ids) {
      await tx.update(students).set(fields(formData, id)).where(eq(students.id, id));
    }
  });
  revalidatePath("/record");
  revalidatePath("/exams");
  revalidatePath("/reports");
}
