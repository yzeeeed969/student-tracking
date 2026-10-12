import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBackup, runReconcile } from "./actions";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const backup = await getBackup();
  const [rep] = await db.select().from(settings).where(eq(settings.key, "_maint_report"));
  let report: { at: string; report: string[] } | null = null;
  try {
    report = rep ? JSON.parse(rep.value) : null;
  } catch {}

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-5 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">صيانة: مطابقة الكشف الرسمي</h1>
        <div className="card p-4 text-sm text-amber-700 dark:text-amber-400">
          صفحة مؤقتة. الحذف نهائي. تم تجهيز نسخة احتياطية للطلاب الخمسة أدناه قبل أي حذف.
        </div>

        <div className="card p-4 space-y-2">
          <h2 className="font-bold">النسخة الاحتياطية (الطلاب المرشَّحون للحذف)</h2>
          <div className="text-muted text-xs">
            {backup.students.length} طلاب · {backup.quranMarks.length} قرآن ·{" "}
            {backup.homeworkMarks.length} واجبات · {backup.behaviorNotes.length} ملاحظات ·{" "}
            {backup.contactLogs.length} سجل تواصل
          </div>
          <pre
            id="backup-json"
            dir="ltr"
            className="text-[10px] bg-black/5 dark:bg-white/5 rounded-md p-2 overflow-auto max-h-64 whitespace-pre-wrap"
          >
            {JSON.stringify(backup)}
          </pre>
        </div>

        <form action={runReconcile} className="card p-4 space-y-3">
          <h2 className="font-bold">تنفيذ المطابقة</h2>
          <p className="text-sm text-muted">
            8 تحديثات · نقل طالب · إعادة تسمية الطالب 74 · حذف 5 طلاب (بعد التحقق من الاسم).
          </p>
          <button className="btn bg-red-600 hover:bg-red-700">تنفيذ الآن</button>
        </form>

        {report && (
          <div className="card p-4 space-y-2">
            <h2 className="font-bold">نتيجة آخر تنفيذ</h2>
            <div className="text-muted text-xs">{report.at}</div>
            <ul id="report" className="text-sm space-y-1 list-none">
              {report.report.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
