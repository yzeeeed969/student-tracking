import ThemeToggle from "@/components/ThemeToggle";
import ParentLookup from "@/components/ParentLookup";

export const dynamic = "force-dynamic";

// صفحة عامة مخصّصة لتقارير الطلاب: ولي الأمر يدخل رقم جواله فيرى تقرير ابنه فقط.
export default function Showcase() {
  return (
    <div className="min-h-screen">
      <header className="card m-3 px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-brand text-lg">
          متابعة الطلاب — تقارير الطلاب
        </div>
        <ThemeToggle />
      </header>
      <main className="p-4 max-w-2xl mx-auto">
        <ParentLookup />
        <p className="text-center text-muted text-xs mt-6">
          صفحة خاصة بأولياء الأمور — تُعرض بيانات الطالب عند إدخال رقم الجوال
          المسجّل لدى المعلم.
        </p>
      </main>
    </div>
  );
}
