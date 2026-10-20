import ThemeToggle from "@/components/ThemeToggle";
import ParentLookup from "@/components/ParentLookup";
import { getSettings } from "@/lib/settings";
import { db } from "@/db";
import { worksheets } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Link = { label: string; url: string };
function parseLinks(raw: string): Link[] {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

// صفحة عامة مخصّصة لتقارير الطلاب: ولي الأمر يدخل رقم جواله فيرى تقرير ابنه فقط.
export default async function Showcase() {
  const s = await getSettings();
  const line = [
    s.teacher,
    s.subject ? `مادة ${s.subject}` : "",
    s.school,
  ]
    .filter(Boolean)
    .join(" · ");

  // تحويل رقم المعلم إلى صيغة واتساب الدولية (966...)
  const waDigits = (s.teacher_whatsapp || "").replace(/\D/g, "");
  const teacherWa = waDigits
    ? waDigits.startsWith("966")
      ? waDigits
      : waDigits.startsWith("0")
      ? "966" + waDigits.slice(1)
      : "966" + waDigits
    : "";

  const pubSheets = (
    await db
      .select()
      .from(worksheets)
      .where(eq(worksheets.published, true))
      .orderBy(asc(worksheets.order), asc(worksheets.num))
  )
    .map((ws) => ({ ...ws, parsed: parseLinks(ws.links) }))
    .filter((ws) => ws.parsed.length > 0);

  return (
    <div className="min-h-screen">
      <header className="card m-3 px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-bold text-brand text-lg">
            متابعة الطلاب — تقارير الطلاب
          </div>
          {line && <div className="text-muted text-sm mt-0.5">{line}</div>}
        </div>
        <ThemeToggle />
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-5">
        <ParentLookup teacherWa={teacherWa} />

        {pubSheets.length > 0 && (
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-lg text-brand">أوراق العمل</h2>
            <p className="text-muted text-sm">
              روابط أوراق عمل الدروس — متاحة للجميع.
            </p>
            <div className="space-y-1.5">
              {pubSheets.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between gap-2 text-sm rounded-md bg-brandsoft/40 px-3 py-2 flex-wrap"
                >
                  <span className="font-medium flex-1 min-w-32">
                    {ws.title || `الدرس ${ws.num}`}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ws.parsed.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs rounded-md bg-brand text-white px-3 py-1 hover:opacity-90"
                      >
                        📄 {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-muted text-xs mt-6">
          صفحة خاصة بأولياء الأمور — تُعرض بيانات الطالب عند إدخال رقم الجوال
          المسجّل لدى المعلم.
        </p>
      </main>
    </div>
  );
}
