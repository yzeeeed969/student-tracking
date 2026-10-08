"use server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteBook(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!id) return;
  await db.delete(books).where(eq(books.id, id));
  revalidatePath("/books");
}
