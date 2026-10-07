"use server";
import { db } from "@/db";
import { students, classRooms } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^\d]/g, "");
  if (p.startsWith("00966")) p = p.slice(2);
  if (p.startsWith("0")) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

export async function addStudent(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const classId = Number(formData.get("classId"));
  const guardianName = String(formData.get("guardianName") || "").trim();
  const phone = normalizePhone(String(formData.get("phone") || ""));
  if (!name || !classId) return;

  const cls = await db
    .select()
    .from(classRooms)
    .where(eq(classRooms.id, classId));
  const prefix = cls[0]?.name.includes("2") ? "2" : "1";
  const countRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.classId, classId));
  const n = (countRows[0]?.c ?? 0) + 1;
  const code = `${prefix}-${String(n).padStart(2, "0")}`;

  await db
    .insert(students)
    .values({ code, name, classId, guardianName, phone });
  revalidatePath("/students");
}

export async function updateStudent(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const classId = Number(formData.get("classId"));
  const guardianName = String(formData.get("guardianName") || "").trim();
  const phone = normalizePhone(String(formData.get("phone") || ""));
  if (!id) return;
  await db
    .update(students)
    .set({ name, classId, guardianName, phone })
    .where(eq(students.id, id));
  revalidatePath("/students");
}

export async function deleteStudent(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(students).where(eq(students.id, id));
  revalidatePath("/students");
}

export async function addClass(formData: FormData) {
  const name = String(formData.get("className") || "").trim();
  if (!name) return;
  const existing = await db
    .select()
    .from(classRooms)
    .where(eq(classRooms.name, name));
  if (existing.length) return;
  const countRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(classRooms);
  await db
    .insert(classRooms)
    .values({ name, order: countRows[0]?.c ?? 0 });
  revalidatePath("/students");
}
