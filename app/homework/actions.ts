"use server";
import { db } from "@/db";
import { homeworkMarks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveHomework(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
  const count = Number(formData.get("count") || 18);

  for (const id of ids) {
    for (let num = 1; num <= count; num++) {
      const raw = formData.get(`hw_${id}_${num}`);
      const val =
        raw === null || String(raw).trim() === "" ? null : Number(raw);
      const existing = await db
        .select()
        .from(homeworkMarks)
        .where(
          and(eq(homeworkMarks.studentId, id), eq(homeworkMarks.num, num))
        );
      if (val === null) {
        if (existing.length)
          await db
            .delete(homeworkMarks)
            .where(
              and(
                eq(homeworkMarks.studentId, id),
                eq(homeworkMarks.num, num)
              )
            );
      } else if (existing.length) {
        await db
          .update(homeworkMarks)
          .set({ score: val })
          .where(
            and(eq(homeworkMarks.studentId, id), eq(homeworkMarks.num, num))
          );
      } else {
        await db
          .insert(homeworkMarks)
          .values({ studentId: id, num, score: val });
      }
    }
  }
  revalidatePath("/homework");
  revalidatePath("/grades");
}
