import { NextResponse } from "next/server";
import { getClasses, computeClassGrades } from "@/lib/grades";

export const dynamic = "force-dynamic";

// نقطة مؤقّتة للقراءة فقط — محميّة بمفتاح سرّي — لاستخراج تفصيل درجات الطلاب
const KEY = "76891b56e13ce8b658";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY)
    return new NextResponse("forbidden", { status: 403 });

  const classes = await getClasses();
  const out: unknown[] = [];
  for (const c of classes) {
    const { rows, w } = await computeClassGrades(c.id);
    for (const r of rows) {
      out.push({
        name: r.name,
        cls: c.name,
        quran: r.quran,
        oralWritten: r.oralWritten,
        hwScore: r.homeworkScore,
        hwDone: r.homeworkDone,
        wsGrade: r.worksheetsGrade,
        wsDone: r.worksheetDone,
        part: r.participationGrade,
        total: r.total,
      });
    }
    out.push({ _weights: w });
  }
  return NextResponse.json(out);
}
