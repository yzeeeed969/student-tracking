import { getPlan, applyPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExamFillPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const { plan, unmatched } = await getPlan();

  async function run() {
    "use server";
    const { redirect } = await import("next/navigation");
    const n = await applyPlan();
    redirect(`/examfill?done=${n}`);
  }

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-5 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">
          رصد التحريري الأول من ملف الإكسل (لمن درجته فارغة)
        </h1>

        {done && (
          <div className="card p-4 text-brand bg-brandsoft text-sm">
            ✅ تم الرصد لـ {done} طالبًا. يمكنك الآن إغلاق هذه الصفحة.
          </div>
        )}

        <div className="card p-4 text-sm text-muted">
          يُرصد فقط للطلاب الذين درجتهم فارغة. الدرجة من ٢٠ تُقسَم على ٢ (من ١٠).
          الفصل المعتمد هو نظام المتابعة (لا الملف)، فمن أجاب عبر رابط الفصل الآخر
          تُوضع درجته في فصله الصحيح (مُعلَّم بـ⚠️).
        </div>

        <div className="card p-4 space-y-2">
          <h2 className="font-bold">
            سيُرصد لـ {plan.length} طالبًا
          </h2>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الفصل</th>
                  <th>اسمه في الملف</th>
                  <th>من ٢٠</th>
                  <th>تُرصد /١٠</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.className}</td>
                    <td className="text-muted">{p.fileName}</td>
                    <td className="text-center">{p.score20}</td>
                    <td className="text-center font-bold text-brand">
                      {p.score10}
                    </td>
                    <td>{p.wrongLink ? "⚠️ رابط الفصل الآخر" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {unmatched.length > 0 && (
          <div className="card p-4 space-y-2">
            <h2 className="font-bold text-amber-600">
              بلا درجة في الملف — تبقى فارغة ({unmatched.length})
            </h2>
            <ul className="text-sm list-disc pr-5 space-y-0.5">
              {unmatched.map((u, i) => (
                <li key={i}>
                  {u.name} <span className="text-muted">— {u.className}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!done && (
          <form action={run}>
            <button className="btn bg-brand">تطبيق الرصد الآن</button>
          </form>
        )}
      </main>
    </div>
  );
}
