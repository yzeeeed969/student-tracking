"use server";
import { db } from "@/db";
import { behaviorNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { backOk } from "@/lib/flash";

export async function addNote(formData: FormData) {
  const studentId = Number(formData.get("studentId"));
  const type = String(formData.get("type") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dateStr = String(formData.get("date") || "");
  if (!studentId || !type) return;
  await db.insert(behaviorNotes).values({
    studentId,
    type,
    category: "سلوك",
    description,
    date: dateStr ? new Date(dateStr + "T08:00:00") : new Date(),
  });
  revalidatePath("/behavior");
  backOk(formData, "/behavior", "تم تسجيل الملاحظة");
}

export async function deleteNote(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(behaviorNotes).where(eq(behaviorNotes.id, id));
  revalidatePath("/behavior");
  backOk(formData, "/behavior", "تم حذف الملاحظة");
}
