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

// حفظ فوري لخانة اختبار واحدة (o1/o2/w1/w2) — للنافذة المنبثقة
const EXAM_FIELD: Record<string, "oral1" | "oral2" | "written1" | "written2"> = {
  o1: "oral1",
  o2: "oral2",
  w1: "written1",
  w2: "written2",
};
export async function setExamCell(
  studentId: number,
  field: string,
  value: string
) {
  const col = EXAM_FIELD[field];
  if (!studentId || !col) return;
  let v: number | null = null;
  if (value !== "" && value != null) {
    const n = Number(value);
    if (Number.isFinite(n)) v = Math.max(0, Math.min(10, n));
  }
  await db
    .update(students)
    .set({ [col]: v })
    .where(eq(students.id, studentId));
  revalidatePath("/record");
  revalidatePath("/reports");
  revalidatePath("/showcase");
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
