import Nav from "@/components/Nav";
import { db } from "@/db";
import { students, classRooms, behaviorNotes, contactLogs } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function stat(q: Promise<{ c: number }[]>) {
  const r = await q;
  return r[0]?.c ?? 0;
}

export default async function Dashboard() {
  const classes = await db.select().from(classRooms).orderBy(classRooms.order);
  const perClass = await Promise.all(
    classes.map(async (c) => ({
      name: c.name,
      count: await stat(
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(students)
          .where(eq(students.classId, c.id))
      ),
    }))
  );
  const total = await stat(
    db.select({ c: sql<number>`count(*)::int` }).from(students)
  );
  const notes = await stat(
    db.select({ c: sql<number>`count(*)::int` }).from(behaviorNotes)
  );
  const sent = await stat(
    db.select({ c: sql<number>`count(*)::int` }).from(contactLogs)
  );

  const cards = [
    { label: "إجمالي الطلاب", value: total, href: "/students" },
    ...perClass.map((p) => ({
      label: `فصل ${p.name}`,
      value: p.count,
      href: "/students",
    })),
    { label: "الملاحظات المسجّلة", value: notes, href: "/behavior" },
    { label: "رسائل واتساب المرسلة", value: sent, href: "/behavior" },
  ];

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-5">
        <h1 className="text-xl font-bold">لوحة المتابعة</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c, i) => (
            <Link key={i} href={c.href} className="card p-5 block">
              <div className="text-3xl font-bold text-brand">{c.value}</div>
              <div className="text-muted text-sm mt-1">{c.label}</div>
            </Link>
          ))}
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-3">روابط سريعة</h2>
          <div className="flex gap-2 flex-wrap">
            <Link href="/grades" className="btn">
              إدخال الدرجات
            </Link>
            <Link href="/homework" className="btn btn-ghost">
              الواجبات
            </Link>
            <Link href="/behavior" className="btn btn-ghost">
              تسجيل سلوك/ملاحظة
            </Link>
            <Link href="/reports" className="btn btn-ghost">
              تقارير الطلاب
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
