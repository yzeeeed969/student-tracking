"use server";
import { db } from "@/db";
import { evidenceFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteEvidence(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(evidenceFiles).where(eq(evidenceFiles.id, id));
  revalidatePath("/evidence", "layout");
}

export async function renameEvidence(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim().slice(0, 200);
  const note = String(formData.get("note") || "").trim().slice(0, 500);
  if (!id || !title) return;
  await db.update(evidenceFiles).set({ title, note }).where(eq(evidenceFiles.id, id));
  revalidatePath("/evidence", "layout");
}

// نقل شاهد إلى بند آخر
export async function moveEvidence(formData: FormData) {
  const id = Number(formData.get("id"));
  const element = Number(formData.get("element"));
  if (!id || !(element >= 1 && element <= 11)) return;
  await db.update(evidenceFiles).set({ element }).where(eq(evidenceFiles.id, id));
  revalidatePath("/evidence", "layout");
}
