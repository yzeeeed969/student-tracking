"use server";
import { db } from "@/db";
import { homeworkSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// حذف صورة واجب مُسلّم (لا يمسّ درجة الواجب المرصودة)
export async function deleteSubmission(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(homeworkSubmissions).where(eq(homeworkSubmissions.id, id));
  revalidatePath("/homework-submissions");
}
