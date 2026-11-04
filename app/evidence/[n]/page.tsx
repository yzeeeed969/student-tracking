import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { evidenceFiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ELEMENTS, elementByNum, systemStats, autoEvidence } from "@/lib/evidence";
import { buildPlans } from "@/lib/plans";
import ConfirmForm from "@/components/ConfirmForm";
import ToastForm from "@/components/ToastForm";
import { deleteEvidence, renameEvidence, moveEvidence } from "../actions";

export const dynamic = "force-dynamic";

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} م.ب` : `${Math.max(1, Math.round(b / 1024))} ك.ب`;
}

export default async function EvidenceElementPage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { n: nStr } = await params;
  const sp = await searchParams;
  const n = Number(nStr);
  const el = elementByNum(n);
  if (!el) notFound();

  const [stats, plans, files] = await Promise.all([
    systemStats(),
    buildPlans(),
    db
      .select({
        id: evidenceFiles.id,
        title: evidenceFiles.title,
        note: evidenceFiles.note,
        mime: evidenceFiles.mime,
        size: evidenceFiles.size,
        createdAt: evidenceFiles.createdAt,
      })
      .from(evidenceFiles)
      .where(eq(evidenceFiles.element, n))
      .orderBy(desc(evidenceFiles.createdAt)),
  ]);
  const weak = plans.rows.filter((r) => r.level === "weak").length;
  const strong = plans.rows.filter((r) => r.level === "strong").length;
  const auto = autoEvidence(stats, { weak, strong })[n] ?? [];

  const prev = n > 1 ? n - 1 : null;
  const next = n < 11 ? n + 1 : null;

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Link href="/evidence" className="text-sm text-muted hover:text-brand">
              ← كل البنود
            </Link>
            <h1 className="text-xl font-bold">
              <span className="text-brand">{String(n).padStart(2, "0")}</span> · {el.title}
            </h1>
            <div className="text-xs text-muted">الوزن النسبي {el.weight}٪</div>
          </div>
          <div className="flex gap-2">
            {prev && <Link href={`/evidence/${prev}`} className="btn btn-ghost text-sm">→ البند {prev}</Link>}
            {next && <Link href={`/evidence/${next}`} className="btn btn-ghost text-sm">البند {next} ←</Link>}
          </div>
        </div>

        {/* ما يطلبه النموذج */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="card p-4 space-y-2">
            <div className="font-bold text-sm">أمثلة على تحقق البند</div>
            <ul className="list-disc pr-5 text-sm space-y-1">
              {el.examples.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="card p-4 space-y-2">
            <div className="font-bold text-sm">الشواهد المطلوبة في النموذج</div>
            <ul className="list-disc pr-5 text-sm space-y-1">
              {el.required.map((x) => <li key={x}>{x}</li>)}
            </ul>
            {el.adminHeld && (
              <div className="text-xs bg-brandsoft text-brand rounded-lg p-2">🏫 {el.adminHeld}</div>
            )}
          </div>
        </div>

        {/* الشواهد التلقائية */}
        <div className="card p-4 space-y-3">
          <div className="font-bold">⚡ شواهد تلقائية من النظام</div>
          {auto.length === 0 ? (
            <div className="text-sm text-muted">
              هذا البند لا يُستخرج من بيانات الموقع؛ شواهده ملفات ترفعها أنت (زيارات، دورات، شهادات…).
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {auto.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className={`rounded-xl border border-[var(--border)] p-3 block hover:border-[var(--brand)] ${a.count > 0 ? "" : "opacity-50"}`}
                >
                  <div className="font-medium text-sm">{a.count > 0 ? "✅" : "⏳"} {a.title}</div>
                  <div className="text-xs text-muted mt-1">{a.count > 0 ? a.detail : "لا توجد بيانات بعد"}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* رفع ملفات */}
        <div className="card p-4 space-y-3">
          <div className="font-bold">📎 رفع شاهد (صورة أو PDF)</div>
          {sp.e === "nofile" && <div className="text-red-500 text-sm">لم تختر ملفًا.</div>}
          {sp.e === "big" && <div className="text-red-500 text-sm">الملف أكبر من 15 ميغابايت.</div>}
          <form
            action="/api/evidence-upload"
            method="post"
            encType="multipart/form-data"
            className="grid md:grid-cols-2 gap-2"
          >
            <input type="hidden" name="element" value={n} />
            <input name="title" placeholder="اسم الشاهد (اختياري — يُؤخذ من اسم الملف)" className="text-sm" />
            <input name="note" placeholder="وصف مختصر (اختياري)" className="text-sm" />
            <input
              type="file"
              name="files"
              multiple
              required
              accept="image/*,application/pdf,.pdf"
              aria-label="ملفات الشاهد"
              className="text-sm md:col-span-2"
            />
            <button className="btn md:col-span-2">رفع</button>
          </form>
          <p className="text-xs text-muted">يمكنك اختيار عدة ملفات معًا. تُحفظ داخل قاعدة بيانات الموقع.</p>
        </div>

        {/* الملفات المرفوعة */}
        <div className="space-y-2">
          <div className="font-bold">الملفات المرفوعة ({files.length})</div>
          {files.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">لا توجد ملفات بعد.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((f) => {
                const isImg = f.mime.startsWith("image/");
                return (
                  <div key={f.id} className="card p-2 space-y-2">
                    <a href={`/api/evidence-file/${f.id}`} target="_blank" rel="noopener noreferrer" className="block">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/evidence-file/${f.id}`}
                          alt={f.title}
                          loading="lazy"
                          className="w-full h-44 object-cover rounded-md bg-black/5"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-md bg-brandsoft text-brand flex items-center justify-center text-3xl">
                          📄
                        </div>
                      )}
                    </a>
                    <details className="px-1">
                      <summary className="cursor-pointer text-sm font-bold leading-snug list-none">
                        {f.title}
                        <span className="block text-[11px] text-muted font-normal">
                          {fmtSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("ar-SA-u-nu-latn")} · تعديل ▾
                        </span>
                      </summary>
                      <div className="space-y-2 pt-2">
                        <ToastForm action={renameEvidence} toast="تم الحفظ" className="space-y-1">
                          <input type="hidden" name="id" value={f.id} />
                          <input name="title" defaultValue={f.title} className="w-full text-xs" />
                          <input name="note" defaultValue={f.note} placeholder="وصف" className="w-full text-xs" />
                          <button className="btn btn-ghost text-xs w-full">حفظ الاسم</button>
                        </ToastForm>
                        <ToastForm action={moveEvidence} toast="تم النقل" className="flex gap-1">
                          <input type="hidden" name="id" value={f.id} />
                          <select name="element" defaultValue={n} className="text-xs flex-1">
                            {ELEMENTS.map((e) => (
                              <option key={e.n} value={e.n}>{e.n} - {e.title}</option>
                            ))}
                          </select>
                          <button className="btn btn-ghost text-xs">نقل</button>
                        </ToastForm>
                        <a href={`/api/evidence-file/${f.id}?dl=1`} className="text-xs text-brand hover:underline block">⬇ تنزيل</a>
                        <ConfirmForm action={deleteEvidence} confirm="حذف هذا الشاهد نهائيًا؟">
                          <input type="hidden" name="id" value={f.id} />
                          <button className="text-xs text-red-500 hover:underline">🗑 حذف</button>
                        </ConfirmForm>
                      </div>
                    </details>
                    {f.note && <div className="text-xs text-muted px-1">{f.note}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
