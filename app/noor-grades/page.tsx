import { db } from "@/db";
import {
  students,
  classRooms,
  quranMarks,
  homeworkMarks,
  worksheetMarks,
  worksheets,
  participation,
} from "@/db/schema";
import { asc } from "drizzle-orm";
import { SURAHS } from "@/lib/surahs";

export const dynamic = "force-dynamic";

// أداة حساب درجات نور (الفترتان) — تشخيصية للمعايرة قبل الاعتماد
// النموذج: كل مكوّن يُقسم نصفين (فترة أولى/ثانية)، وتُدرَّج درجة كل فترة إلى 100
// ثم تُقسم لخانتَي نور: 60 (قرآن+شفهي وتحريري) و40 (واجبات+أوراق عمل+مشاركة).

const CEIL2 = (x: number) => Math.ceil(x * 100) / 100;

export default async function NoorGradesPage() {
  const cls = await db.select().from(classRooms).orderBy(asc(classRooms.order), asc(classRooms.id));
  const sts = await db.select().from(students).orderBy(asc(students.name));
  const qm = await db.select().from(quranMarks);
  const hm = await db.select().from(homeworkMarks);
  const wsRows = await db.select().from(worksheets);
  const wm = await db.select().from(worksheetMarks);
  const pt = await db.select().from(participation);

  const wsNumById = new Map(wsRows.map((w) => [w.id, w.num]));

  // تقدّم كل فصل: أبعد واجب وأبعد سورة
  const hwMaxByClass = new Map<number, number>();
  const surahIdxByClass = new Map<number, number>();
  const stClass = new Map(sts.map((s) => [s.id, s.classId]));
  for (const h of hm) {
    const c = stClass.get(h.studentId);
    if (c == null) continue;
    hwMaxByClass.set(c, Math.max(hwMaxByClass.get(c) ?? 0, h.num));
  }
  for (const q of qm) {
    const c = stClass.get(q.studentId);
    if (c == null) continue;
    const idx = SURAHS.findIndex((s) => s.num === q.surah);
    if (idx >= 0) surahIdxByClass.set(c, Math.max(surahIdxByClass.get(c) ?? -1, idx));
  }

  // مشاركة: المجموع لكل طالب + الأعلى لكل فصل
  const partByStudent = new Map<number, number>();
  for (const p of pt) partByStudent.set(p.studentId, (partByStudent.get(p.studentId) ?? 0) + Number(p.points));
  const maxPartByClass = new Map<number, number>();
  for (const s of sts) {
    const v = partByStudent.get(s.id) ?? 0;
    maxPartByClass.set(s.classId, Math.max(maxPartByClass.get(s.classId) ?? 0, v));
  }

  // فهارس سريعة
  const qByStudent = new Map<number, { surah: number; points: number }[]>();
  for (const q of qm) {
    const a = qByStudent.get(q.studentId) ?? [];
    a.push({ surah: q.surah, points: q.points });
    qByStudent.set(q.studentId, a);
  }
  const hwByStudent = new Map<number, { num: number; score: number | null }[]>();
  for (const h of hm) {
    const a = hwByStudent.get(h.studentId) ?? [];
    a.push({ num: h.num, score: h.score });
    hwByStudent.set(h.studentId, a);
  }
  const wmByStudent = new Map<number, { num: number; score: number | null }[]>();
  for (const w of wm) {
    const a = wmByStudent.get(w.studentId) ?? [];
    a.push({ num: wsNumById.get(w.worksheetId) ?? 0, score: w.score });
    wmByStudent.set(w.studentId, a);
  }

  const P1_SURAHS = new Set(SURAHS.slice(0, 10).map((s) => s.num));
  const classNameById = new Map(cls.map((c) => [c.id, c.name]));

  function row(s: (typeof sts)[number]) {
    const classId = s.classId;
    const reachedSurah = surahIdxByClass.get(classId) ?? -1; // 0-based
    const reachedHw = hwMaxByClass.get(classId) ?? 0;
    const maxPart = maxPartByClass.get(classId) ?? 0;

    // ---- القرآن (الفترة الأولى: أول 10 سور) ----
    const qs = qByStudent.get(s.id) ?? [];
    const qEarnedP1 = qs
      .filter((x) => P1_SURAHS.has(x.surah))
      .reduce((a, x) => a + x.points / 3, 0);
    const qRecordedP1 = qs.filter((x) => P1_SURAHS.has(x.surah)).length;
    const reachedHalfSurah = Math.min(reachedSurah + 1, 10); // كم سورة من النصف الأول وصلها الفصل

    // ---- الاختبارات (الفترة الأولى: شفهي1 + تحريري1) ----
    const o1 = s.oral1,
      w1 = s.written1;
    const examGivenP1 = (o1 != null ? 1 : 0) + (w1 != null ? 1 : 0);
    const examEarnedP1 = (o1 ?? 0) + (w1 ?? 0);

    // ---- الواجبات (1..9) ----
    const hws = hwByStudent.get(s.id) ?? [];
    const hwEarnedP1 = hws.filter((x) => x.num >= 1 && x.num <= 9).reduce((a, x) => a + (x.score ?? 0), 0);
    const hwRecordedP1 = hws.filter((x) => x.num >= 1 && x.num <= 9).length;
    const reachedHalfHw = Math.min(reachedHw, 9);

    // ---- أوراق العمل (1..9) ----
    const wsMine = (wmByStudent.get(s.id) ?? []).filter((x) => x.num >= 1 && x.num <= 9);
    const wsCountP1 = wsMine.length;
    const wsSumP1 = wsMine.reduce((a, x) => a + (x.score ?? 0), 0);
    const wsAvgP1 = wsCountP1 > 0 ? wsSumP1 / wsCountP1 : 0; // /10

    // ---- المشاركة ----
    const partRaw = partByStudent.get(s.id) ?? 0;
    const partGrade = maxPart > 0 ? (partRaw / maxPart) * 13 : 0; // /13 نسبي

    // ---- حساب نور المبدئي (مع تدريج المُنجَز) ----
    const qRatio = reachedHalfSurah > 0 ? qEarnedP1 / reachedHalfSurah : 0;
    const qPeriod = qRatio * 20; // /20
    const examRatio = examGivenP1 > 0 ? examEarnedP1 / (examGivenP1 * 10) : 0;
    const examPeriod = examRatio * 40; // /40
    const g60 = CEIL2(qPeriod + examPeriod);

    const hwRatio = reachedHalfHw > 0 ? hwEarnedP1 / reachedHalfHw : 0;
    const hwPeriod = hwRatio * 18;
    const wsPeriod = (wsAvgP1 / 10) * 9;
    const partPeriod = partGrade; // /13
    const g40 = CEIL2(hwPeriod + wsPeriod + partPeriod);

    return {
      id: s.id,
      name: s.name,
      cls: classNameById.get(classId) ?? "",
      reachedSurah: reachedSurah + 1,
      reachedHw,
      qEarnedP1: CEIL2(qEarnedP1),
      qRecordedP1,
      o1,
      w1,
      hwEarnedP1,
      hwRecordedP1,
      wsCountP1,
      wsAvgP1: CEIL2(wsAvgP1),
      partRaw,
      maxPart,
      partGrade: CEIL2(partGrade),
      g60: Math.ceil(g60),
      g40: Math.ceil(g40),
      total: Math.ceil(g60) + Math.ceil(g40),
    };
  }

  const rows = sts.map(row);
  const focus = rows.filter((r) =>
    ["بدر فراس", "احمد زهير", "AIMEN"].some((n) => r.name.includes(n))
  );

  return (
    <div className="min-h-screen p-4 space-y-4 text-sm">
      <h1 className="text-xl font-bold">أداة حساب درجات نور — تشخيص الفترة الأولى</h1>

      <div className="card p-3">
        <div className="font-bold mb-2">عيّنة التحقّق (مقارنة مع نور):</div>
        <pre dir="ltr" className="text-xs whitespace-pre-wrap">
{focus
  .map(
    (r) =>
      `${r.name} [${r.cls}] | reachedSurah=${r.reachedSurah} reachedHw=${r.reachedHw}
   Q: earnedP1=${r.qEarnedP1} recorded=${r.qRecordedP1} | exams o1=${r.o1} w1=${r.w1}
   HW: earnedP1=${r.hwEarnedP1} recorded=${r.hwRecordedP1} | WS: count=${r.wsCountP1} avg=${r.wsAvgP1}
   PART: raw=${r.partRaw} max=${r.maxPart} grade=${r.partGrade}
   => Noor60=${r.g60} Noor40=${r.g40} total=${r.total}`
  )
  .join("\n\n")}
        </pre>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-brandsoft">
            <th className="border p-1">الطالب</th>
            <th className="border p-1">الفصل</th>
            <th className="border p-1">ق.P1</th>
            <th className="border p-1">ش1</th>
            <th className="border p-1">ت1</th>
            <th className="border p-1">واجب.P1</th>
            <th className="border p-1">أوراق#</th>
            <th className="border p-1">أوراق~</th>
            <th className="border p-1">مشاركة</th>
            <th className="border p-1">نور60</th>
            <th className="border p-1">نور40</th>
            <th className="border p-1">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border p-1 whitespace-nowrap">{r.name}</td>
              <td className="border p-1">{r.cls}</td>
              <td className="border p-1 text-center">{r.qEarnedP1}</td>
              <td className="border p-1 text-center">{r.o1 ?? "—"}</td>
              <td className="border p-1 text-center">{r.w1 ?? "—"}</td>
              <td className="border p-1 text-center">{r.hwEarnedP1}</td>
              <td className="border p-1 text-center">{r.wsCountP1}</td>
              <td className="border p-1 text-center">{r.wsAvgP1}</td>
              <td className="border p-1 text-center">{r.partGrade}</td>
              <td className="border p-1 text-center font-bold">{r.g60}</td>
              <td className="border p-1 text-center font-bold">{r.g40}</td>
              <td className="border p-1 text-center font-bold">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
