"use server";
import { db } from "@/db";
import { worksheetMarks, worksheets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ——— رصد درجة ورقة عمل واحدة لطالب (من 20) — حفظ فوري ———
export async function setWorksheetCell(
  studentId: number,
  worksheetId: number,
  value: string
) {
  if (!studentId || !worksheetId) return;
  if (value === "" || value == null) {
    await db
      .delete(worksheetMarks)
      .where(
        and(
          eq(worksheetMarks.studentId, studentId),
          eq(worksheetMarks.worksheetId, worksheetId)
        )
      );
  } else {
    let score = Number(value);
    if (Number.isNaN(score)) return;
    score = Math.max(0, Math.min(20, score));
    await db
      .insert(worksheetMarks)
      .values({ studentId, worksheetId, score })
      .onConflictDoUpdate({
        target: [worksheetMarks.studentId, worksheetMarks.worksheetId],
        set: { score },
      });
  }
  revalidatePath("/record");
  revalidatePath("/reports");
  revalidatePath("/showcase");
}

function clean(u: string): string {
  const t = String(u || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : "";
}

// ——— حفظ رابطَي الدرس (ثالث أول/ثاني) وحالة النشر ———
export async function saveWorksheet(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const urlC1 = clean(String(formData.get("urlC1") || ""));
  const urlC2 = clean(String(formData.get("urlC2") || ""));
  const published = formData.get("published") ? true : false;
  await db
    .update(worksheets)
    .set({ urlC1, urlC2, published })
    .where(eq(worksheets.id, id));
  revalidatePath("/worksheets");
  revalidatePath("/showcase");
}
