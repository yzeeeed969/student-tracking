import Link from "next/link";
import { ELEMENTS, systemStats, autoEvidence, fileCounts, statusOf } from "@/lib/evidence";
import { buildPlans } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const [stats, files, plans] = await Promise.all([systemStats(), fileCounts(), buildPlans()]);
  const weak = plans.rows.filter((r) => r.level === "weak").length;
  const strong = plans.rows.filter((r) => r.level === "strong").length;
  const auto = autoEvidence(stats, { weak, strong });

  const items = ELEMENTS.map((e) => {
    const a = (auto[e.n] ?? []).filter((x) => x.count > 0).length;
    const f = files.get(e.n) ?? 0;
    return { e, a, f, st: statusOf(a + f) };
  });
  const done = items.filter((i) => i.a + i.f >= 3).length;
  const empty = items.filter((i) => i.a + i.f === 0);

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">الشواهد التعليمية</h1>
          <div className="flex gap-2 flex-wrap">
            <Link href="/evidence/plan" className="btn text-sm">الخطة العلاجية والإثرائية</Link>
            <Link href="/evidence/print" className="btn btn-ghost text-sm">ملف الشواهد للطباعة</Link>
          </div>
        </div>

        <div className="card p-4 text-sm leading-relaxed space-y-1">
          <div>
            عناصر تقييم الأداء الوظيفي (11 بندًا). لكل بند نوعان من الشواهد:
          </div>
          <div>
            <b className="text-brand">⚡ شواهد تلقائية</b>: تُستخرج من عملك في الموقع وتتحدّث وحدها
            (الرسائل، الواجبات، أوراق العمل، الحوائط، السلوك…).
          </div>
          <div>
            <b className="text-brand">📎 ملفات مرفوعة</b>: صور وشهادات وتقارير ترفعها بنفسك داخل البند.
          </div>
          <div className="text-muted pt-1">
            المكتمل: {done} من 11
            {empty.length > 0 && (
              <> · بنود فارغة: {empty.map((i) => `البند ${i.e.n}`).join("، ")}</>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(({ e, a, f, st }) => (
            <Link
              key={e.n}
              href={`/evidence/${e.n}`}
              className="card p-4 space-y-2 hover:border-[var(--brand)] transition-colors block"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold leading-snug">
                  <span className="text-brand">{String(e.n).padStart(2, "0")}</span> · {e.title}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              <div className="text-xs text-muted">الوزن النسبي {e.weight}٪</div>
              <div className="flex gap-3 text-sm">
                <span>⚡ {a} تلقائي</span>
                <span>📎 {f} ملف</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
