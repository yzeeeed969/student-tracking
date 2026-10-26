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

// ——— إدارة أوراق العمل (العنوان/الروابط/النشر) ———
type Link = { label: string; url: string };

function parseLinks(raw: string): Link[] {
  return String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes("|") ? "|" : line.includes("،") ? "،" : "";
      if (sep) {
        const [label, ...rest] = line.split(sep);
        const url = rest.join(sep).trim();
        return { label: label.trim() || "فتح الورقة", url };
      }
      return { label: "فتح الورقة", url: line };
    })
    .filter((l) => /^https?:\/\//i.test(l.url));
}

export async function saveWorksheet(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const title = String(formData.get("title") || "").trim();
  const links = JSON.stringify(parseLinks(String(formData.get("links") || "")));
  const published = formData.get("published") ? true : false;
  await db
    .update(worksheets)
    .set({ title, links, published })
    .where(eq(worksheets.id, id));
  revalidatePath("/worksheets");
  revalidatePath("/showcase");
}

export async function addWorksheet(formData: FormData) {
  const num = Number(formData.get("num"));
  const classId = Number(formData.get("classId"));
  const title = String(formData.get("title") || "").trim() || `الدرس ${num}`;
  if (!num || !classId) return;
  const existing = await db
    .select({ id: worksheets.id })
    .from(worksheets)
    .where(and(eq(worksheets.classId, classId), eq(worksheets.num, num)));
  if (existing.length) return;
  await db.insert(worksheets).values({ classId, num, title, order: num });
  revalidatePath("/worksheets");
}

export async function deleteWorksheet(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(worksheets).where(eq(worksheets.id, id));
  revalidatePath("/worksheets");
  revalidatePath("/record");
  revalidatePath("/showcase");
}
