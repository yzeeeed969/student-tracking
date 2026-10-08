"use server";
import { db } from "@/db";
import { videoFolders, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addFolder(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) return;
  await db.insert(videoFolders).values({ name });
  revalidatePath("/youtube");
}

export async function deleteFolder(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!id) return;
  await db.delete(videoFolders).where(eq(videoFolders.id, id));
  revalidatePath("/youtube");
}

export async function addVideo(fd: FormData) {
  const folderId = Number(fd.get("folderId"));
  const title = String(fd.get("title") || "").trim();
  const url = String(fd.get("url") || "").trim();
  if (!folderId || !title || !url) return;
  await db.insert(videos).values({ folderId, title, url });
  revalidatePath("/youtube");
}

export async function deleteVideo(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!id) return;
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/youtube");
}
