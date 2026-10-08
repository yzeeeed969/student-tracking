"use server";
import { db } from "@/db";
import { students, classRooms } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function parseIds(fd: FormData): number[] {
  return String(fd.get("ids") || "")
    .split(",")
    .map((x) => Number(x))
    .filter(Boolean);
}

export async function bulkMoveStudents(fd: FormData) {
  const ids = parseIds(fd);
  const classId = Number(fd.get("classId"));
  if (!ids.length || !classId) return;
  await db.update(students).set({ classId }).where(inArray(students.id, ids));
  revalidatePath("/students");
  revalidatePath("/grades");
}

export async function bulkDeleteStudents(fd: FormData) {
  const ids = parseIds(fd);
  if (!ids.length) return;
  await db.delete(students).where(inArray(students.id, ids));
  revalidatePath("/students");
}

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

  // توليد كود جديد لا يتعارض مع أي كود موجود:
  // نأخذ أكبر رقم مستخدم لنفس البادئة (عبر كل الفصول) ثم نزيد عليه واحدًا.
  const all = await db.select({ code: students.code }).from(students);
  const used = new Set(all.map((r) => r.code));
  let n = all
    .map((r) => r.code)
    .filter((c) => c.startsWith(prefix + "-"))
    .map((c) => parseInt(c.slice(prefix.length + 1), 10))
    .filter((x) => !Number.isNaN(x))
    .reduce((mx, x) => Math.max(mx, x), 0);
  let code: string;
  do {
    n += 1;
    code = `${prefix}-${String(n).padStart(2, "0")}`;
  } while (used.has(code));

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
  const readingLevel = Number(formData.get("readingLevel") || 0);
  if (!id) return;
  await db
    .update(students)
    .set({ name, classId, guardianName, phone, readingLevel })
    .where(eq(students.id, id));
  revalidatePath("/students");
  revalidatePath("/grades");
}

// تعيين مستوى القراءة لمجموعة طلاب محدّدين
export async function bulkSetReading(fd: FormData) {
  const ids = parseIds(fd);
  const readingLevel = Number(fd.get("readingLevel") || 0);
  if (!ids.length) return;
  await db
    .update(students)
    .set({ readingLevel })
    .where(inArray(students.id, ids));
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
