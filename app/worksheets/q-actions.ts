"use server";
import { db } from "@/db";
import { worksheetQuestions } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// إضافة سؤال فارغ جديد لورقة عمل (يفتح للتعبئة)
export async function addQuestion(fd: FormData) {
  const worksheetId = Math.round(Number(fd.get("worksheetId")));
  if (!worksheetId) return;
  const [mx] = await db
    .select({ m: sql<number>`coalesce(max(${worksheetQuestions.order}),0)` })
    .from(worksheetQuestions)
    .where(eq(worksheetQuestions.worksheetId, worksheetId));
  const order = Number(mx?.m ?? 0) + 1;
  await db.insert(worksheetQuestions).values({
    worksheetId,
    order,
    prompt: "",
    options: JSON.stringify(["", ""]),
    correctIndex: 0,
  });
  revalidatePath(`/worksheets/${worksheetId}`);
}

// حفظ سؤال: النص + الخيارات (سطر لكل خيار) + رقم الخيار الصحيح
export async function saveQuestion(fd: FormData) {
  const questionId = Math.round(Number(fd.get("questionId")));
  if (!questionId) return;
  const prompt = String(fd.get("prompt") || "").trim();
  const rawOpts = String(fd.get("options") || "");
  const options = rawOpts
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);
  // المعلم يُدخل رقم الخيار الصحيح بدءًا من 1 — نحوّله داخليًا إلى فهرس يبدأ من 0
  let correctIndex = Math.round(Number(fd.get("correct"))) - 1;
  if (!Number.isInteger(correctIndex) || correctIndex < 0) correctIndex = 0;
  if (correctIndex >= options.length) correctIndex = 0;
  await db
    .update(worksheetQuestions)
    .set({ prompt, options: JSON.stringify(options), correctIndex })
    .where(eq(worksheetQuestions.id, questionId));
  revalidatePath("/worksheets");
  revalidatePath("/record");
}

// حذف سؤال
export async function deleteQuestion(fd: FormData) {
  const questionId = Math.round(Number(fd.get("questionId")));
  const worksheetId = Math.round(Number(fd.get("worksheetId")));
  if (!questionId) return;
  await db
    .delete(worksheetQuestions)
    .where(eq(worksheetQuestions.id, questionId));
  if (worksheetId) revalidatePath(`/worksheets/${worksheetId}`);
  revalidatePath("/worksheets");
}

// نقل سؤال لأعلى/أسفل (تبديل الترتيب مع الجار)
export async function moveQuestion(fd: FormData) {
  const worksheetId = Math.round(Number(fd.get("worksheetId")));
  const questionId = Math.round(Number(fd.get("questionId")));
  const dir = String(fd.get("dir") || "");
  if (!worksheetId || !questionId) return;
  const rows = await db
    .select()
    .from(worksheetQuestions)
    .where(eq(worksheetQuestions.worksheetId, worksheetId))
    .orderBy(asc(worksheetQuestions.order), asc(worksheetQuestions.id));
  const i = rows.findIndex((r) => r.id === questionId);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[i];
  const b = rows[j];
  await db.transaction(async (tx) => {
    await tx
      .update(worksheetQuestions)
      .set({ order: b.order })
      .where(eq(worksheetQuestions.id, a.id));
    await tx
      .update(worksheetQuestions)
      .set({ order: a.order })
      .where(eq(worksheetQuestions.id, b.id));
  });
  revalidatePath(`/worksheets/${worksheetId}`);
}
