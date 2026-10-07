import Nav from "@/components/Nav";
import { db } from "@/db";
import { students, classRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addStudent, addClass, deleteStudent } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const classes = await db
    .select()
    .from(classRooms)
    .orderBy(classRooms.order);

  const byClass = await Promise.all(
    classes.map(async (c) => ({
      cls: c,
      rows: await db
        .select()
        .from(students)
        .where(eq(students.classId, c.id))
        .orderBy(students.code),
    }))
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">الطلاب والفصول</h1>
        </div>

        {/* إضافة فصل + طالب */}
        <div className="grid md:grid-cols-2 gap-3">
          <form action={addClass} className="card p-4 space-y-3">
            <h2 className="font-bold">إضافة فصل جديد</h2>
            <div className="flex gap-2">
              <input
                name="className"
                placeholder="مثال: ثالث 3"
                className="flex-1"
                required
              />
              <button className="btn">إضافة</button>
            </div>
          </form>

          <form action={addStudent} className="card p-4 space-y-3">
            <h2 className="font-bold">إضافة طالب جديد</h2>
            <div className="grid grid-cols-2 gap-2">
              <input name="name" placeholder="اسم الطالب" required />
              <select name="classId" required>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input name="guardianName" placeholder="اسم ولي الأمر" />
              <input name="phone" placeholder="جوال ولي الأمر (05...)" />
            </div>
            <button className="btn">إضافة الطالب</button>
          </form>
        </div>

        {/* جداول الفصول */}
        {byClass.map(({ cls, rows }) => (
          <div key={cls.id} className="card p-4 space-y-3">
            <h2 className="font-bold">
              {cls.name}{" "}
              <span className="text-muted text-sm">({rows.length} طالبًا)</span>
            </h2>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم الطالب</th>
                    <th>ولي الأمر</th>
                    <th>الجوال</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td>{s.code}</td>
                      <td>{s.name}</td>
                      <td>{s.guardianName}</td>
                      <td dir="ltr" className="text-right">
                        {s.phone}
                      </td>
                      <td>
                        <form action={deleteStudent}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-red-500 text-sm hover:underline">
                            حذف
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
