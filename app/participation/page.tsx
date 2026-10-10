import ClassTabs from "@/components/ClassTabs";
import { getClasses } from "@/lib/grades";
import { db } from "@/db";
import { students, participation } from "@/db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { getSettings, weights } from "@/lib/settings";
import {
  addParticipation,
  removeLastParticipation,
  deductParticipation,
  bulkParticipation,
} from "./actions";
import ToastForm from "@/components/ToastForm";
import StudentSearch from "@/components/StudentSearch";
import SelectAllCheckbox from "@/components/SelectAllCheckbox";
import ParticipationBulk from "@/components/ParticipationBulk";
import ReadingBadge from "@/components/ReadingBadge";
import { orderByName } from "@/lib/order";

export const dynamic = "force-dynamic";

export default async function ParticipationPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  const classes = await getClasses();
  const sp = await searchParams;
  const activeId = Number(sp.class) || classes[0]?.id;
  const today = new Date();
  const dateStr =
    sp.date ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  const w = weights(await getSettings());

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(orderByName);
  const ids = rows.map((r) => r.id);

  // مجموع المشاركة الكلي لكل طالب
  const totals = ids.length
    ? await db
        .select({
          studentId: participation.studentId,
          total: sql<number>`coalesce(sum(${participation.points}),0)`,
        })
        .from(participation)
        .where(
          sql`${participation.studentId} in (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `
          )})`
        )
        .groupBy(participation.studentId)
    : [];
  const totalMap = new Map(totals.map((t) => [t.studentId, Number(t.total)]));
  const maxPart = Math.max(0, ...ids.map((i) => totalMap.get(i) ?? 0));

  // نقاط اليوم المحدد
  const start = new Date(dateStr + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const todayRows = ids.length
    ? await db
        .select({
          studentId: participation.studentId,
          total: sql<number>`coalesce(sum(${participation.points}),0)`,
        })
        .from(participation)
        .where(
          and(
            gte(participation.date, start),
            lt(participation.date, end),
            sql`${participation.studentId} in (${sql.join(
              ids.map((i) => sql`${i}`),
              sql`, `
            )})`
          )
        )
        .groupBy(participation.studentId)
    : [];
  const todayMap = new Map(todayRows.map((t) => [t.studentId, Number(t.total)]));

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">المشاركة</h1>
          <form className="flex items-center gap-2 text-sm">
            <input type="hidden" name="class" value={activeId} />
            <label>التاريخ:</label>
            <input type="date" name="date" defaultValue={dateStr} />
            <button className="btn-ghost btn">عرض</button>
          </form>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ClassTabs classes={classes} active={activeId} base="/participation" />
          <StudentSearch />
        </div>
        <div className="text-muted text-sm">
          اضغط +1 أو +2 لمن شارك في اليوم المحدّد. الدرجة النهائية /{w.participation}{" "}
          بالموازنة النسبية إلى الأعلى في الفصل.
        </div>

        <ParticipationBulk date={dateStr} bulkParticipation={bulkParticipation} />

        <div className="card p-3 overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>
                  <SelectAllCheckbox />
                </th>
                <th>#</th>
                <th>الطالب</th>
                <th>نقاط اليوم</th>
                <th>تسجيل</th>
                <th>المجموع الكلي</th>
                <th>الدرجة /{w.participation}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => {
                const tot = totalMap.get(st.id) ?? 0;
                const grade =
                  maxPart > 0
                    ? Math.round((tot / maxPart) * w.participation * 100) / 100
                    : 0;
                return (
                  <tr key={st.id} data-name={st.name}>
                    <td>
                      <input type="checkbox" className="rowchk" value={st.id} />
                    </td>
                    <td>{st.code}</td>
                    <td>
                      {st.name} <ReadingBadge level={st.readingLevel} />
                    </td>
                    <td className="text-center font-bold">
                      {todayMap.get(st.id) ?? 0}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-center items-center flex-wrap">
                        <ToastForm action={addParticipation} toast="تم تسجيل مشاركة (+1)">
                          <input type="hidden" name="studentId" value={st.id} />
                          <input type="hidden" name="date" value={dateStr} />
                          <input type="hidden" name="points" value="1" />
                          <button className="btn-ghost btn text-xs px-2 py-1">
                            +1
                          </button>
                        </ToastForm>
                        <ToastForm action={addParticipation} toast="تم تسجيل مشاركة (+2)">
                          <input type="hidden" name="studentId" value={st.id} />
                          <input type="hidden" name="date" value={dateStr} />
                          <input type="hidden" name="points" value="2" />
                          <button className="btn-ghost btn text-xs px-2 py-1">
                            +2
                          </button>
                        </ToastForm>
                        <ToastForm action={deductParticipation} toast="تم خصم نقطة (−1)">
                          <input type="hidden" name="studentId" value={st.id} />
                          <input type="hidden" name="date" value={dateStr} />
                          <input type="hidden" name="amount" value="1" />
                          <button
                            className="btn-ghost btn text-xs px-2 py-1 text-red-600"
                            title="خصم نقطة (مخالفة)"
                          >
                            −1
                          </button>
                        </ToastForm>
                        <ToastForm action={removeLastParticipation} toast="تم التراجع عن آخر إدخال لليوم">
                          <input type="hidden" name="studentId" value={st.id} />
                          <input type="hidden" name="date" value={dateStr} />
                          <button
                            className="text-muted text-xs px-2"
                            title="تراجع عن آخر إدخال لليوم"
                          >
                            ↩
                          </button>
                        </ToastForm>
                        {st.phone && (
                          <a
                            href={`/api/whatsapp?studentId=${st.id}&kind=${encodeURIComponent(
                              "عام"
                            )}`}
                            target="_blank"
                            className="text-xs text-green-600 hover:underline px-1"
                            title="إرسال تعزيز لولي الأمر"
                          >
                            واتساب
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="text-center text-muted">{tot}</td>
                    <td className="text-center font-bold text-brand">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
