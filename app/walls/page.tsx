import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import {
  createWall,
  deleteWall,
  toggleOpen,
  toggleModerated,
} from "./actions";
import ToastForm from "@/components/ToastForm";
import CopyLink from "@/components/CopyLink";
import ConfirmForm from "@/components/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function WallsPage() {
  const rows = await db
    .select({
      id: walls.id,
      slug: walls.slug,
      title: walls.title,
      goal: walls.goal,
      moderated: walls.moderated,
      open: walls.open,
      createdAt: walls.createdAt,
      posts: sql<number>`(select count(*) from ${wallPosts} where ${wallPosts.wallId} = ${walls.id})`,
      pending: sql<number>`(select count(*) from ${wallPosts} where ${wallPosts.wallId} = ${walls.id} and ${wallPosts.approved} = false)`,
    })
    .from(walls)
    .orderBy(desc(walls.createdAt));

  // أصل الرابط (نفس نطاق الموقع) لبناء روابط الحوائط العامة
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : "";

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">حوائط المشاركة</h1>
          <span className="text-muted text-sm">{rows.length} حائطًا</span>
        </div>

        <div className="card p-4 text-sm text-muted leading-relaxed">
          حائط المشاركة صفحة عامة يفتحها الطلاب برابط دون تسجيل دخول، ويضيفون
          فيها مشاركات (نص وصورة اختيارية). انسخ رابط الحائط وشاركه مع طلابك.
          يمكنك حذف أي مشاركة، أو تفعيل «المراجعة قبل النشر»، أو إغلاق الحائط،
          أو حذفه بالكامل (وتُحذف معه كل الصور نهائيًا).
        </div>

        {/* إنشاء حائط جديد */}
        <ToastForm
          action={createWall}
          toast="تم إنشاء الحائط"
          className="card p-4 space-y-3"
        >
          <div className="font-bold">حائط جديد</div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm text-muted">عنوان الحائط *</span>
              <input
                name="title"
                required
                placeholder="مثال: شاركنا أجمل آية حفظتها"
                className="w-full text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-muted">وصف/تعليمات (اختياري)</span>
              <input
                name="goal"
                placeholder="مثال: اكتب اسمك والآية وأرفق صورة إن أحببت"
                className="w-full text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="moderated" value="1" className="w-5 h-5" />
            المراجعة قبل النشر (لا تظهر مشاركة الطالب حتى توافق عليها)
          </label>
          <button className="btn text-sm">إنشاء الحائط</button>
        </ToastForm>

        {/* قائمة الحوائط */}
        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="card p-6 text-center text-muted text-sm">
              لا توجد حوائط بعد. أنشئ أول حائط من الأعلى.
            </div>
          )}
          {rows.map((w) => {
            const url = origin ? `${origin}/w/${w.slug}` : `/w/${w.slug}`;
            return (
              <div key={w.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-lg">{w.title}</div>
                    {w.goal && (
                      <div className="text-muted text-sm mt-1">{w.goal}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        w.open
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {w.open ? "مفتوح" : "مغلق"}
                    </span>
                    {w.moderated && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        مراجعة قبل النشر
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {Number(w.posts)} مشاركة
                      {Number(w.pending) > 0
                        ? ` · ${Number(w.pending)} بانتظار الموافقة`
                        : ""}
                    </span>
                  </div>
                </div>

                {/* الرابط العام + نسخ */}
                <CopyLink url={url} />

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <a
                    href={`/w/${w.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn text-sm"
                  >
                    فتح الحائط
                  </a>
                  <Link
                    href={`/walls/${w.id}`}
                    className="btn-ghost btn text-sm"
                  >
                    إدارة المشاركات
                    {Number(w.pending) > 0 ? ` (${Number(w.pending)})` : ""}
                  </Link>
                  <form action={toggleOpen}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="btn-ghost btn text-sm">
                      {w.open ? "إغلاق الحائط" : "إعادة فتحه"}
                    </button>
                  </form>
                  <form action={toggleModerated}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="btn-ghost btn text-sm">
                      {w.moderated ? "إيقاف المراجعة" : "تفعيل المراجعة"}
                    </button>
                  </form>
                  <ConfirmForm
                    action={deleteWall}
                    confirm={`سيُحذف حائط «${w.title}» وجميع مشاركاته وصوره نهائيًا. هل أنت متأكد؟`}
                    className="ms-auto"
                  >
                    <input type="hidden" name="id" value={w.id} />
                    <button className="btn-ghost btn text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      حذف الحائط نهائيًا
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
