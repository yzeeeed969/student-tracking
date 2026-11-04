import Link from "next/link";
import { buildPlans, REMEDY, ENRICH, WEAK_RATIO, STRONG_RATIO, type PlanRow } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const pct = (r: number) => `${Math.round(r * 100)}٪`;

function Header({ title, s }: { title: string; s: Record<string, string> }) {
  const today = new Date().toLocaleDateString("ar-SA-u-nu-latn-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="text-center space-y-1">
      <div className="text-lg font-bold">{title}</div>
      <div className="text-sm text-muted">
        {s.subject || "الدراسات الإسلامية"} · {s.school ? `مدرسة ${s.school}` : ""} · المعلم: {s.teacher || "—"} · تاريخ الإعداد: {today}
      </div>
    </div>
  );
}

function RemedyCard({ r }: { r: PlanRow }) {
  const areas = r.weakAreas.length ? r.weakAreas : [{ key: "exams" as const, label: "المستوى العام" }];
  return (
    <div className="card p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-bold">{r.name}</div>
        <div className="text-xs text-muted">
          {r.className} · المجموع الحالي {r.total} · {pct(r.ratio)} من متوسط فصله
        </div>
      </div>
      <div>
        <span className="text-muted">جوانب الضعف: </span>
        {areas.map((a) => a.label).join("، ")}
      </div>
      {r.missingHomework.length > 0 && (
        <div>
          <span className="text-muted">تقاويم لم تُحل: </span>
          {r.missingHomework.join("، ")}
        </div>
      )}
      <div>
        <div className="text-muted">الإجراءات العلاجية:</div>
        <ul className="list-disc pr-5 space-y-0.5">
          {[...new Set(areas.flatMap((a) => REMEDY[a.key] ?? REMEDY.exams))].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted pt-1">
        <div className="border-t border-[var(--border)] pt-1">المدة: أسبوعان</div>
        <div className="border-t border-[var(--border)] pt-1">النتيجة بعد المعالجة: ............</div>
        <div className="border-t border-[var(--border)] pt-1">توقيع المعلم: ............</div>
      </div>
    </div>
  );
}

export default async function PlanPage() {
  const [{ rows, summaries }, s] = await Promise.all([buildPlans(), getSettings()]);
  const weak = rows.filter((r) => r.level === "weak").sort((a, b) => a.ratio - b.ratio);
  const strong = rows.filter((r) => r.level === "strong").sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 no-print">
          <div>
            <Link href="/evidence" className="text-sm text-muted hover:text-brand">← الشواهد التعليمية</Link>
            <h1 className="text-xl font-bold">الخطة العلاجية والإثرائية</h1>
          </div>
          <PrintButton />
        </div>

        <div className="card p-4 text-sm text-muted leading-relaxed no-print">
          تُبنى الخطة تلقائيًا من درجاتك في «الرصد»: يُقارن كل طالب بمتوسط فصله. من حصل على أقل من{" "}
          {pct(WEAK_RATIO)} من المتوسط يدخل الخطة العلاجية، ومن حصل على {pct(STRONG_RATIO)} فأكثر يدخل
          الخطة الإثرائية. وتُحدَّد جوانب الضعف بالطريقة نفسها لكل جانب (القرآن، الاختبارات، الواجبات،
          أوراق العمل، المشاركة) مع مستوى القراءة. تتحدّث الخطة وحدها كلما رصدت درجات جديدة.
        </div>

        {/* تحليل النتائج */}
        <section id="analysis" className="space-y-3">
          <Header title="تحليل نتائج المتعلمين وتصنيف مستوياتهم" s={s} />
          <div className="card overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="p-2">الفصل</th>
                  <th className="p-2">عدد الطلاب</th>
                  <th className="p-2">متوسط الفصل</th>
                  <th className="p-2">أعلى درجة</th>
                  <th className="p-2">أدنى درجة</th>
                  <th className="p-2">متميز</th>
                  <th className="p-2">متوسط</th>
                  <th className="p-2">متعثر</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)]">
                    <td className="p-2 font-bold">{c.name}</td>
                    <td className="p-2">{c.count}</td>
                    <td className="p-2">{c.avg}</td>
                    <td className="p-2">{c.max}</td>
                    <td className="p-2">{c.min}</td>
                    <td className="p-2 text-emerald-700 font-bold">{c.strong}</td>
                    <td className="p-2">{c.mid}</td>
                    <td className="p-2 text-red-600 font-bold">{c.weak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            الدرجات تراكمية حتى تاريخ الإعداد (من 100)، والتصنيف نسبيّ بالمقارنة مع متوسط الفصل.
          </p>
        </section>

        {/* الخطة العلاجية */}
        <section className="space-y-3 print-break">
          <Header title={`الخطة العلاجية للطلاب المتعثرين (${weak.length})`} s={s} />
          {weak.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">لا يوجد طلاب متعثرون حسب الدرجات الحالية.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">
              {weak.map((r) => <RemedyCard key={r.id} r={r} />)}
            </div>
          )}
        </section>

        {/* الخطة الإثرائية */}
        <section id="enrich" className="space-y-3 print-break">
          <Header title={`الخطة الإثرائية للطلاب المتميزين (${strong.length})`} s={s} />
          <div className="card p-3 text-sm">
            <div className="text-muted mb-1">الأنشطة الإثرائية المقترحة:</div>
            <ul className="list-disc pr-5 space-y-0.5">
              {ENRICH.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          {strong.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand text-white">
                    <th className="p-2 text-right">الطالب</th>
                    <th className="p-2">الفصل</th>
                    <th className="p-2">المجموع</th>
                    <th className="p-2">نسبته من متوسط الفصل</th>
                    <th className="p-2 text-right">جوانب التميّز</th>
                  </tr>
                </thead>
                <tbody>
                  {strong.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--border)]">
                      <td className="p-2 font-bold">{r.name}</td>
                      <td className="p-2 text-center">{r.className}</td>
                      <td className="p-2 text-center">{r.total}</td>
                      <td className="p-2 text-center">{pct(r.ratio)}</td>
                      <td className="p-2">{r.strongAreas.map((a) => a.label).join("، ") || "المستوى العام"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
