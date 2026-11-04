"use server";
import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// توليد معرّف قصير عشوائي للرابط العام (أحرف وأرقام بسيطة)
function makeSlug(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"; // بلا أحرف متشابهة (0/o ,1/l)
  let s = "";
  for (let i = 0; i < 7; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// إنشاء حائط جديد
export async function createWall(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const goal = String(formData.get("goal") || "").trim().slice(0, 300);
  const moderated = formData.get("moderated") ? true : false;
  // عدد المربّعات (الأماكن) — بين 6 و100، الافتراضي 30
  let cells = Number(formData.get("cells"));
  if (!Number.isFinite(cells)) cells = 30;
  cells = Math.max(6, Math.min(100, Math.round(cells)));

  // ضمان تفرّد المعرّف
  let slug = makeSlug();
  for (let i = 0; i < 5; i++) {
    const [exists] = await db
      .select({ id: walls.id })
      .from(walls)
      .where(eq(walls.slug, slug));
    if (!exists) break;
    slug = makeSlug();
  }

  await db.insert(walls).values({ title, goal, moderated, slug, cells, open: true });
  revalidatePath("/walls");
}

// تعديل حائط قائم: العنوان والوصف وعدد المربّعات فقط (لا يمسّ المشاركات إطلاقًا)
export async function updateWall(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const title = String(formData.get("title") || "").trim();
  const goal = String(formData.get("goal") || "").trim().slice(0, 300);
  // عدد المربّعات — بين 6 و100
  let cells = Number(formData.get("cells"));
  if (!Number.isFinite(cells)) cells = 30;
  cells = Math.max(6, Math.min(100, Math.round(cells)));

  // العنوان مطلوب
  if (!title) {
    redirect("/walls?err=" + encodeURIComponent("عنوان الحائط مطلوب"));
  }

  // قيد مهم: لا يجوز تنقيص عدد المربّعات دون (أعلى رقم مربّع مستخدَم + 1)،
  // لأن أرقام المربّعات تبدأ من 0 (المربّع رقم N يحتاج عددًا لا يقل عن N+1).
  const [row] = await db
    .select({ maxCell: sql<number | null>`max(${wallPosts.cell})` })
    .from(wallPosts)
    .where(eq(wallPosts.wallId, id));
  const maxCell = row?.maxCell;
  if (maxCell != null) {
    const minAllowed = Number(maxCell) + 1;
    if (cells < minAllowed) {
      redirect(
        "/walls?err=" +
          encodeURIComponent(
            `لا يمكن جعل عدد المربّعات أقل من ${minAllowed} لوجود مشاركات في مربّعات أعلى؛ احذف تلك المشاركات أولًا`
          )
      );
    }
  }

  await db.update(walls).set({ title, goal, cells }).where(eq(walls.id, id));
  revalidatePath("/walls");
}

// حذف حائط بالكامل (وتُحذف معه جميع المشاركات والصور — cascade)
export async function deleteWall(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(walls).where(eq(walls.id, id));
  revalidatePath("/walls");
}

// فتح/إغلاق استقبال المشاركات
export async function toggleOpen(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const [w] = await db.select({ open: walls.open }).from(walls).where(eq(walls.id, id));
  if (!w) return;
  await db.update(walls).set({ open: !w.open }).where(eq(walls.id, id));
  revalidatePath("/walls");
}

// تبديل وضع المراجعة (موافقة المعلم قبل الظهور)
export async function toggleModerated(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const [w] = await db
    .select({ moderated: walls.moderated })
    .from(walls)
    .where(eq(walls.id, id));
  if (!w) return;
  await db.update(walls).set({ moderated: !w.moderated }).where(eq(walls.id, id));
  revalidatePath("/walls");
  revalidatePath(`/walls/${id}`);
}

// حذف مشاركة واحدة
export async function deletePost(formData: FormData) {
  const id = Number(formData.get("postId"));
  const wallId = Number(formData.get("wallId"));
  if (!id) return;
  await db.delete(wallPosts).where(eq(wallPosts.id, id));
  if (wallId) revalidatePath(`/walls/${wallId}`);
}

// الموافقة على مشاركة معلّقة
export async function approvePost(formData: FormData) {
  const id = Number(formData.get("postId"));
  const wallId = Number(formData.get("wallId"));
  if (!id) return;
  await db.update(wallPosts).set({ approved: true }).where(eq(wallPosts.id, id));
  if (wallId) revalidatePath(`/walls/${wallId}`);
}
