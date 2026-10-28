"use server";
import { db } from "@/db";
import { worksheetMarks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ——— أداة مؤقتة: رصد درجات أوراق العمل دفعة واحدة (لا تمسح أي درجة موجودة) ———
const WSADMIN_KEY = "tmp_9f3kQ27xZ_wsadmin";

export async function applyWsMarks(formData: FormData) {
  if (String(formData.get("k") || "") !== WSADMIN_KEY) return;
  const raw = String(formData.get("payload") || "").trim();
  if (!raw) return;
  let arr: { s: number; w: number; v: number }[];
  try {
    arr = JSON.parse(raw);
  } catch {
    return;
  }
  let inserted = 0;
  let skipped = 0;
  for (const m of arr) {
    if (!m.s || !m.w) continue;
    const existing = await db
      .select({ id: worksheetMarks.id })
      .from(worksheetMarks)
      .where(
        and(
          eq(worksheetMarks.studentId, m.s),
          eq(worksheetMarks.worksheetId, m.w)
        )
      );
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }
    await db
      .insert(worksheetMarks)
      .values({ studentId: m.s, worksheetId: m.w, score: m.v })
      .onConflictDoNothing();
    inserted += 1;
  }
  revalidatePath("/wsadmin");
  revalidatePath("/record");
  revalidatePath("/reports");
  revalidatePath("/showcase");
  console.log(`[wsadmin] inserted=${inserted} skipped=${skipped}`);
}
