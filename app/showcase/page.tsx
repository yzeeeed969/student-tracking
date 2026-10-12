import ThemeToggle from "@/components/ThemeToggle";
import ParentLookup from "@/components/ParentLookup";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

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
      <main className="p-4 max-w-2xl mx-auto">
        <ParentLookup teacherWa={teacherWa} />
        <p className="text-center text-muted text-xs mt-6">
          صفحة خاصة بأولياء الأمور — تُعرض بيانات الطالب عند إدخال رقم الجوال
          المسجّل لدى المعلم.
        </p>
      </main>
    </div>
  );
}
