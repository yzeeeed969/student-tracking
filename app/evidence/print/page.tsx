import Link from "next/link";
import { db } from "@/db";
import { evidenceFiles } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ELEMENTS, systemStats, autoEvidence } from "@/lib/evidence";
import { buildPlans } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

// ملف الشواهد كاملًا في صفحة واحدة قابلة للطباعة أو الحفظ PDF
export default async function EvidencePrintPage() {
  const [stats, plans, s, files] = await Promise.all([
    systemStats(),
    buildPlans(),
    getSettings(),
    db
      .select({
        id: evidenceFiles.id,
        element: evidenceFiles.element,
        title: evidenceFiles.title,
        note: evidenceFiles.note,
        mime: evidenceFiles.mime,
      })
      .from(evidenceFiles)
      .orderBy(asc(evidenceFiles.element), asc(evidenceFiles.createdAt)),
  ]);
  const weak = plans.rows.filter((r) => r.level === "weak").length;
  const strong = plans.rows.filter((r) => r.level === "strong").length;
  const auto = autoEvidence(stats, { weak, strong });

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 no-print">
          <Link href="/evidence" className="text-sm text-muted hover:text-brand">← الشواهد التعليمية</Link>
          <PrintButton />
        </div>

        <div className="card p-6 text-center space-y-2">
          <div className="text-2xl font-bold">ملف الشواهد التعليمية</div>
          <div className="text-muted">عناصر تقييم الأداء الوظيفي للمعلم</div>
          <div className="text-sm">
            المعلم: {s.teacher || "—"} · المادة: {s.subject || "—"} · {s.school ? `مدرسة ${s.school}` : ""}
          </div>
        </div>

        {ELEMENTS.map((e) => {
          const a = (auto[e.n] ?? []).filter((x) => x.count > 0);
          const fs = files.filter((f) => f.element === e.n);
          return (
            <section key={e.n} className="card p-4 space-y-3 print-break">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="text-lg font-bold">
                  ({e.n}) {e.title}
                </div>
                <div className="text-sm text-muted">الوزن النسبي {e.weight}٪</div>
              </div>
              {e.adminHeld && <div className="text-xs text-muted">🏫 {e.adminHeld}</div>}
              {a.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold text-sm">شواهد من نظام متابعة الطلاب:</div>
                  <ul className="list-disc pr-5 text-sm space-y-0.5">
                    {a.map((x) => (
                      <li key={x.title}>
                        <b>{x.title}</b> — {x.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fs.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {fs.map((f) =>
                    f.mime.startsWith("image/") ? (
                      <figure key={f.id} className="space-y-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/evidence-file/${f.id}`} alt={f.title} className="w-full rounded-md border border-[var(--border)]" />
                        <figcaption className="text-xs text-center">{f.title}</figcaption>
                      </figure>
                    ) : (
                      <a key={f.id} href={`/api/evidence-file/${f.id}`} target="_blank" className="text-sm text-brand underline">
                        📄 {f.title}
                      </a>
                    )
                  )}
                </div>
              )}
              {a.length === 0 && fs.length === 0 && (
                <div className="text-sm text-red-600">لا توجد شواهد لهذا البند بعد.</div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
