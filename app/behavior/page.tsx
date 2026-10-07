import Nav from "@/components/Nav";
import { db } from "@/db";
import { students, behaviorNotes, contactLogs, classRooms } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { addNote, deleteNote } from "./actions";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ar-SA-u-nu-latn");
}

export default async function BehaviorPage() {
  const s = await getSettings();
  const types: string[] = JSON.parse(s.behavior_types || "[]");
  const allStudents = await db
    .select({
      id: students.id,
      name: students.name,
      className: classRooms.name,
    })
    .from(students)
    .leftJoin(classRooms, eq(students.classId, classRooms.id))
    .orderBy(students.code);

  const notes = await db
    .select({
      id: behaviorNotes.id,
      date: behaviorNotes.date,
      type: behaviorNotes.type,
      description: behaviorNotes.description,
      studentId: behaviorNotes.studentId,
      studentName: students.name,
    })
    .from(behaviorNotes)
    .leftJoin(students, eq(behaviorNotes.studentId, students.id))
    .orderBy(desc(behaviorNotes.date))
    .limit(50);

  const logs = await db
    .select({
      id: contactLogs.id,
      date: contactLogs.date,
      kind: contactLogs.kind,
      message: contactLogs.message,
      studentName: students.name,
    })
    .from(contactLogs)
    .leftJoin(students, eq(contactLogs.studentId, students.id))
    .orderBy(desc(contactLogs.date))
    .limit(50);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-5">
        <h1 className="text-xl font-bold">السلوك والملاحظات</h1>

        {/* إضافة ملاحظة */}
        <form action={addNote} className="card p-4 space-y-3">
          <h2 className="font-bold">تسجيل سلوك / ملاحظة</h2>
          <div className="grid md:grid-cols-4 gap-2">
            <select name="studentId" required>
              <option value="">اختر الطالب…</option>
              {allStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.className})
                </option>
              ))}
            </select>
            <select name="type" required>
              <option value="">نوع السلوك…</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="date" name="date" defaultValue={dateStr} />
            <input name="description" placeholder="وصف (اختياري)" />
          </div>
          <button className="btn">تسجيل</button>
        </form>

        {/* سجل الملاحظات */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold">سجل الملاحظات (آخر 50)</h2>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الطالب</th>
                  <th>السلوك</th>
                  <th>الوصف</th>
                  <th>إرسال واتساب</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id}>
                    <td className="whitespace-nowrap">{fmt(n.date)}</td>
                    <td>{n.studentName}</td>
                    <td>{n.type}</td>
                    <td className="text-muted">{n.description}</td>
                    <td className="text-center">
                      <a
                        className="btn-ghost btn text-xs px-2 py-1"
                        target="_blank"
                        href={`/api/whatsapp?studentId=${
                          n.studentId
                        }&kind=${encodeURIComponent(
                          "مخالفة"
                        )}&violation=${encodeURIComponent(
                          "* " + n.type + (n.description ? " - " + n.description : "")
                        )}`}
                      >
                        ✉ إرسال
                      </a>
                    </td>
                    <td>
                      <form action={deleteNote}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="text-red-500 text-xs">حذف</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {notes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      لا توجد ملاحظات بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* سجل التواصل التلقائي */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold">سجل التواصل عبر واتساب (توثيق تلقائي)</h2>
          <div className="text-muted text-sm">
            يُسجَّل كل إرسال هنا تلقائيًا بمجرد ضغطك زر الإرسال.
          </div>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الطالب</th>
                  <th>نوع الرسالة</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap">{fmt(l.date)}</td>
                    <td>{l.studentName}</td>
                    <td>{l.kind}</td>
                    <td className="text-muted">{l.message}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      لا يوجد تواصل مسجّل بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
