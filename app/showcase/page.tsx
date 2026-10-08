import { db } from "@/db";
import {
  students,
  classRooms,
  quranMarks,
  contactLogs,
  behaviorNotes,
  participation,
  videos,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

// صفحة عرض عامة للزوّار — إنجازات بلا بيانات حساسة (لا أرقام ولا درجات تفصيلية)
export default async function Showcase() {
  const classes = await db.select().from(classRooms).orderBy(classRooms.order);
  const perClass = await Promise.all(
    classes.map(async (c) => ({
      cls: c,
      count: (
        await db.select({ id: students.id }).from(students).where(eq(students.classId, c.id))
      ).length,
    }))
  );
  const totalStudents = perClass.reduce((a, b) => a + b.count, 0);

  const [[quranCount], [notesCount], [msgCount], [partCount]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(quranMarks),
    db.select({ n: sql<number>`count(*)::int` }).from(behaviorNotes),
    db.select({ n: sql<number>`count(*)::int` }).from(contactLogs),
    db.select({ n: sql<number>`count(*)::int` }).from(participation),
  ]);

  // أحدث إنجازات الحفظ (اسم الطالب + رقم السورة) بلا درجات حساسة
  const recentQuran = await db
    .select({
      name: students.name,
      surah: quranMarks.surah,
      id: quranMarks.id,
    })
    .from(quranMarks)
    .innerJoin(students, eq(quranMarks.studentId, students.id))
    .orderBy(desc(quranMarks.id))
    .limit(12);

  const [videoCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(videos);

  const stats = [
    { label: "إجمالي الطلاب", value: totalStudents },
    { label: "سور حُفظت ورُصدت", value: quranCount?.n ?? 0 },
    { label: "رسائل أولياء الأمور", value: msgCount?.n ?? 0 },
    { label: "مشاركات مرصودة", value: partCount?.n ?? 0 },
    { label: "ملاحظات موثّقة", value: notesCount?.n ?? 0 },
    { label: "مقاطع تعليمية", value: videoCount?.n ?? 0 },
  ];

  const surahName = (n: number) =>
    ({ 114: "الناس", 113: "الفلق", 112: "الإخلاص", 111: "المسد", 110: "النصر", 109: "الكافرون", 108: "الكوثر", 107: "الماعون", 106: "قريش", 105: "الفيل", 104: "الهمزة", 103: "العصر", 102: "التكاثر", 101: "القارعة", 100: "العاديات", 99: "الزلزلة" } as Record<number, string>)[n] || `سورة ${n}`;

  return (
    <div className="min-h-screen">
      <header className="card m-3 px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-brand text-lg">
          متابعة الطلاب — صفحة العرض
        </div>
        <ThemeToggle />
      </header>
      <main className="p-4 space-y-5">
        <div className="card p-6 text-center">
          <div className="text-muted">نظام متابعة طلاب الصف الثالث الابتدائي</div>
          <div className="text-4xl font-bold text-brand mt-2">{totalStudents}</div>
          <div className="text-muted text-sm">إجمالي الطلاب</div>
        </div>

        {/* إحصاءات الإنجازات */}
        <div>
          <h2 className="font-bold mb-2">لوحة الإنجازات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-3xl font-bold text-brand">{s.value}</div>
                <div className="text-muted text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* الفصول */}
        <div>
          <h2 className="font-bold mb-2">الفصول</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {perClass.map((d) => (
              <div key={d.cls.id} className="card p-5 text-center">
                <div className="text-3xl font-bold text-brand">{d.count}</div>
                <div className="text-muted text-sm mt-1">{d.cls.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* أحدث إنجازات الحفظ */}
        {recentQuran.length > 0 && (
          <div className="card p-4 space-y-2">
            <h2 className="font-bold">أحدث إنجازات حفظ القرآن</h2>
            <div className="flex flex-wrap gap-2">
              {recentQuran.map((r) => (
                <span
                  key={r.id}
                  className="bg-brandsoft text-brand rounded-full px-3 py-1 text-sm"
                >
                  {r.name} — {surahName(r.surah)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-muted text-xs">
          صفحة عرض عامة — لا تتضمّن أرقام تواصل ولا درجات تفصيلية.
        </div>
      </main>
    </div>
  );
}
