"use server";
import { db } from "@/db";
import { participation } from "@/db/schema";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { backOk } from "@/lib/flash";

function dayRange(dateStr: string) {
  const start = new Date(dateStr + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function addParticipation(formData: FormData) {
  const studentId = Number(formData.get("studentId"));
  const points = Number(formData.get("points") || 1);
  const dateStr = String(formData.get("date"));
  if (!studentId || !dateStr) return;
  await db
    .insert(participation)
    .values({ studentId, points, date: new Date(dateStr + "T08:00:00") });
  revalidatePath("/participation");
  revalidatePath("/grades");
  backOk(formData, "/participation", `تم تسجيل مشاركة (+${points})`);
}

// خصم نقطة (مخالفة): يُسجّل نقطة سالبة بنفس طريقة المنح
export async function deductParticipation(formData: FormData) {
  const studentId = Number(formData.get("studentId"));
  const dateStr = String(formData.get("date"));
  const amount = Number(formData.get("amount") || 1);
  if (!studentId || !dateStr) return;
  await db
    .insert(participation)
    .values({ studentId, points: -Math.abs(amount), date: new Date(dateStr + "T08:00:00") });
  revalidatePath("/participation");
  revalidatePath("/grades");
  backOk(formData, "/participation", `تم خصم (${Math.abs(amount)})`);
}

export async function removeLastParticipation(formData: FormData) {
  const studentId = Number(formData.get("studentId"));
  const dateStr = String(formData.get("date"));
  if (!studentId || !dateStr) return;
  const { start, end } = dayRange(dateStr);
  const rows = await db
    .select()
    .from(participation)
    .where(
      and(
        eq(participation.studentId, studentId),
        gte(participation.date, start),
        lt(participation.date, end)
      )
    )
    .orderBy(desc(participation.id))
    .limit(1);
  if (rows.length)
    await db.delete(participation).where(eq(participation.id, rows[0].id));
  revalidatePath("/participation");
  revalidatePath("/grades");
  backOk(formData, "/participation", "تم التراجع عن آخر إدخال لليوم");
}
