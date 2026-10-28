import { db } from "@/db";
import { students, classRooms, worksheets, worksheetMarks } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { applyWsMarks } from "./actions";

export const dynamic = "force-dynamic";

// صفحة مؤقتة لرصد درجات أوراق العمل دفعة واحدة — تُحذف بعد الانتهاء
export default async function WsAdmin() {
  const classes = await db
    .select({ id: classRooms.id, name: classRooms.name, order: classRooms.order })
    .from(classRooms)
    .orderBy(asc(classRooms.order), asc(classRooms.id));

  const studs = await db
    .select({ id: students.id, name: students.name, classId: students.classId })
    .from(students)
    .orderBy(asc(students.classId), asc(students.id));

  const sheets = await db
    .select({ id: worksheets.id, num: worksheets.num, title: worksheets.title })
    .from(worksheets)
    .orderBy(asc(worksheets.num));

  // عدد الدرجات المرصودة حاليًا لكل ورقة عمل (للتحقق)
  const counts = await db
    .select({
      worksheetId: worksheetMarks.worksheetId,
      cnt: sql<number>`count(*)::int`,
    })
    .from(worksheetMarks)
    .groupBy(worksheetMarks.worksheetId);
  const cntMap = new Map(counts.map((c) => [c.worksheetId, Number(c.cnt)]));

  const roster = {
    classes,
    students: studs,
    worksheets: sheets.map((s) => ({ ...s, marks: cntMap.get(s.id) ?? 0 })),
  };

  return (
    <div style={{ padding: 16, fontFamily: "monospace" }}>
      <h1>wsadmin (مؤقت)</h1>
      <h2>ROSTER_JSON_START</h2>
      <pre id="roster" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(roster)}
      </pre>
      <h2>ROSTER_JSON_END</h2>
      <form action={applyWsMarks} style={{ marginTop: 20 }}>
        <input type="hidden" name="k" value="tmp_9f3kQ27xZ_wsadmin" />
        <textarea
          name="payload"
          id="payload"
          rows={6}
          style={{ width: "100%", direction: "ltr" }}
          placeholder='[{"s":1,"w":2,"v":10}, ...]'
        />
        <button type="submit" style={{ marginTop: 8, padding: "8px 16px" }}>
          تطبيق الرصد (لا يمسح الموجود)
        </button>
      </form>
    </div>
  );
}
