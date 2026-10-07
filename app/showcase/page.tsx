import { db } from "@/db";
import { students, classRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

// صفحة عرض عامة للزوّار — بلا بيانات حساسة (لا أرقام أولياء أمور)
export default async function Showcase() {
  const classes = await db.select().from(classRooms).orderBy(classRooms.order);
  const data = await Promise.all(
    classes.map(async (c) => ({
      cls: c,
      count: (
        await db.select().from(students).where(eq(students.classId, c.id))
      ).length,
    }))
  );
  const total = data.reduce((a, b) => a + b.count, 0);

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
          <div className="text-4xl font-bold text-brand mt-2">{total}</div>
          <div className="text-muted text-sm">إجمالي الطلاب</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map((d) => (
            <div key={d.cls.id} className="card p-5 text-center">
              <div className="text-3xl font-bold text-brand">{d.count}</div>
              <div className="text-muted text-sm mt-1">فصل {d.cls.name}</div>
            </div>
          ))}
        </div>
        <div className="text-center text-muted text-xs">
          صفحة عرض عامة — لا تتضمّن بيانات حساسة.
        </div>
      </main>
    </div>
  );
}
