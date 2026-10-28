import { NextResponse } from "next/server";
import { db } from "@/db";
import { worksheetMarks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// مسار مؤقت عام (محمي برمز) لرصد درجات أوراق العمل دفعة واحدة — يُحذف بعد الانتهاء
const KEY = "tmp_9f3kQ27xZ_wsadmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || body.k !== KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const arr: { s: number; w: number; v: number }[] = Array.isArray(body.marks)
    ? body.marks
    : [];
  let inserted = 0;
  let skipped = 0;
  for (const m of arr) {
    if (!m.s || !m.w) continue;
    const ex = await db
      .select({ id: worksheetMarks.id })
      .from(worksheetMarks)
      .where(
        and(
          eq(worksheetMarks.studentId, m.s),
          eq(worksheetMarks.worksheetId, m.w)
        )
      );
    if (ex.length) {
      skipped += 1;
      continue;
    }
    const v = Math.max(0, Math.min(10, Number(m.v) || 0));
    await db
      .insert(worksheetMarks)
      .values({ studentId: m.s, worksheetId: m.w, score: v })
      .onConflictDoNothing();
    inserted += 1;
  }
  return NextResponse.json({ inserted, skipped, total: arr.length });
}
