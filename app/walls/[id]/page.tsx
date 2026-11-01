import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approvePost, deletePost } from "../actions";
import AutoRefresh from "@/components/AutoRefresh";
import ConfirmForm from "@/components/ConfirmForm";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("ar-SA-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function WallModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wallId = Number(id);
  const [wall] = await db.select().from(walls).where(eq(walls.id, wallId));
  if (!wall) notFound();

  const posts = await db
    .select({
      id: wallPosts.id,
      name: wallPosts.name,
      text: wallPosts.text,
      mime: wallPosts.mime,
      approved: wallPosts.approved,
      createdAt: wallPosts.createdAt,
      hasImage: sql<boolean>`${wallPosts.image} is not null`,
    })
    .from(wallPosts)
    .where(eq(wallPosts.wallId, wallId))
    .orderBy(desc(wallPosts.createdAt));

  // المعلّقة أولًا ثم المنشورة (الأحدث فالأقدم داخل كل مجموعة)
  const pending = posts.filter((p) => !p.approved);
  const approved = posts.filter((p) => p.approved);

  function card(p: (typeof posts)[number]) {
    const hasImg = !!p.hasImage;
    return (
      <div key={p.id} className="card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold">{p.name || "بدون اسم"}</span>
          <span className="text-xs text-muted">{fmt(p.createdAt)}</span>
        </div>
        {p.text && (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {p.text}
          </div>
        )}
        {hasImg && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/wall/${wall.slug}/image/${p.id}`}
            alt=""
            className="rounded-lg max-h-72 w-auto"
          />
        )}
        <div className="flex items-center gap-2 pt-1">
          {!p.approved && (
            <form action={approvePost}>
              <input type="hidden" name="postId" value={p.id} />
              <input type="hidden" name="wallId" value={wallId} />
              <button className="btn text-sm">نشر المشاركة</button>
            </form>
          )}
          <ConfirmForm
            action={deletePost}
            confirm="سيُحذف هذه المشاركة وصورتها نهائيًا. متابعة؟"
          >
            <input type="hidden" name="postId" value={p.id} />
            <input type="hidden" name="wallId" value={wallId} />
            <button className="btn-ghost btn text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              حذف
            </button>
          </ConfirmForm>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AutoRefresh seconds={15} />
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Link href="/walls" className="text-sm text-brand hover:underline">
              ← كل الحوائط
            </Link>
            <h1 className="text-xl font-bold mt-1">إدارة: {wall.title}</h1>
          </div>
          <a
            href={`/w/${wall.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost btn text-sm"
          >
            فتح الحائط
          </a>
        </div>

        <div className="card p-3 text-sm text-muted">
          إجمالي المشاركات: {posts.length}
          {pending.length > 0 ? ` · بانتظار الموافقة: ${pending.length}` : ""} ·
          الصفحة تتحدّث تلقائيًا.
        </div>

        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-amber-600">
              بانتظار الموافقة ({pending.length})
            </h2>
            {pending.map(card)}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-bold">المنشورة ({approved.length})</h2>
          {approved.length === 0 && (
            <div className="card p-6 text-center text-muted text-sm">
              لا توجد مشاركات منشورة بعد.
            </div>
          )}
          {approved.map(card)}
        </section>
      </main>
    </div>
  );
}
