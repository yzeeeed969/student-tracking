"use server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveGrades(formData: FormData) {
  const classId = Number(formData.get("classId"));
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);

  for (const id of ids) {
    const oRaw = formData.get(`oral_${id}`);
    const oralWritten =
      oRaw === null || String(oRaw).trim() === "" ? null : Number(oRaw);
    await db
      .update(students)
      .set({ oralWritten })
      .where(eq(students.id, id));
  }
  revalidatePath("/grades");
}
