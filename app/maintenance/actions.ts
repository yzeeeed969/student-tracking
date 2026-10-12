"use server";
import { db } from "@/db";
import {
  students,
  classRooms,
  quranMarks,
  homeworkMarks,
  participation,
  behaviorNotes,
  contactLogs,
  settings,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// تطبيع الاسم للمقارنة فقط
function norm(s: string): string {
  return (s || "")
    .replace(/[ً-ْٰ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

// تحديثات ولي الأمر/الجوال (بالمعرّف)
const PHONE_UPDATES: {
  id: number;
  phone: string;
  guardian?: string;
  expect?: string;
}[] = [
  { id: 18, phone: "966581083182" },
  { id: 45, phone: "966500504152" },
  { id: 71, phone: "966556577417", expect: "يزيد ماجد" },
  { id: 73, phone: "966556997067", guardian: "سلطان ذيب سلطان البقمي", expect: "فهد سلطان" },
  { id: 78, phone: "966551899381", expect: "محمد سلطان" },
  { id: 79, phone: "966500025275", guardian: "فراس غسان السعدي", expect: "سلطان فراس" },
  { id: 80, phone: "966501549789", expect: "عمر يونس" },
  { id: 81, phone: "966557718802", guardian: "سلطان عبدالله مذكر المطيري", expect: "فيصل سلطان" },
];

// إعادة تسمية الطالب 74 إلى الاسم الرسمي (نفس الطالب)
const RENAME = {
  id: 74,
  name: "عبدالرحمن فيصل غازي",
  guardian: "فيصل غازي رحيل الشمري",
  phone: "966533224392",
  expect: "عبد الرحمن فيصل",
};

// نقل بين الفصول: الطالب 22 إلى ثالث أول (الفصل الذي لا يحوي "2")
const MOVE = { id: 22, expect: "فهد حمدان" };

// حذف نهائي (انتقلوا لمدارس أخرى)
const DELETES: { id: number; expect: string }[] = [
  { id: 16, expect: "عبدالله مفرح" },
  { id: 38, expect: "يوسف شوردي" },
  { id: 39, expect: "ابراهيم محمد" },
  { id: 51, expect: "زياد سلطان" },
  { id: 60, expect: "عز عبدالرحيم" },
];

// يقرأ كل بيانات الطلاب الخمسة (مع درجاتهم) للنسخة الاحتياطية
export async function getBackup() {
  const ids = DELETES.map((d) => d.id);
  const rows = await db.select().from(students).where(inArray(students.id, ids));
  const q = await db.select().from(quranMarks).where(inArray(quranMarks.studentId, ids));
  const h = await db.select().from(homeworkMarks).where(inArray(homeworkMarks.studentId, ids));
  const p = await db.select().from(participation).where(inArray(participation.studentId, ids));
  const b = await db.select().from(behaviorNotes).where(inArray(behaviorNotes.studentId, ids));
  const c = await db.select().from(contactLogs).where(inArray(contactLogs.studentId, ids));
  return { students: rows, quranMarks: q, homeworkMarks: h, participation: p, behaviorNotes: b, contactLogs: c };
}

export async function runReconcile() {
  const report: string[] = [];
  const classes = await db.select().from(classRooms);
  const classFirst = classes.find((c) => !c.name.includes("2")); // ثالث أول
  const classById = new Map(classes.map((c) => [c.id, c.name] as const));

  // 0) نسخة احتياطية تُخزَّن داخل قاعدة البيانات أيضًا
  const backup = await getBackup();
  await db
    .insert(settings)
    .values({ key: "_maint_backup", value: JSON.stringify(backup) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(backup) } });
  report.push(`✅ نسخة احتياطية محفوظة (_maint_backup): ${backup.students.length} طلاب، ${backup.quranMarks.length} درجة قرآن، ${backup.homeworkMarks.length} درجة واجب، ${backup.behaviorNotes.length} ملاحظة.`);

  // 1) تحديثات الجوال/ولي الأمر
  for (const u of PHONE_UPDATES) {
    const [st] = await db.select().from(students).where(eq(students.id, u.id));
    if (!st) {
      report.push(`⚠️ تحديث #${u.id}: الطالب غير موجود — تخطّي.`);
      continue;
    }
    const set: { phone: string; guardianName?: string } = { phone: u.phone };
    if (u.guardian) set.guardianName = u.guardian;
    await db.update(students).set(set).where(eq(students.id, u.id));
    report.push(
      `✅ تحديث #${u.id} (${st.name}): الجوال ${st.phone || "—"} ← ${u.phone}` +
        (u.guardian ? ` · ولي الأمر ${st.guardianName || "—"} ← ${u.guardian}` : "")
    );
  }

  // 2) إعادة تسمية الطالب 74
  {
    const [st] = await db.select().from(students).where(eq(students.id, RENAME.id));
    if (!st) report.push(`⚠️ إعادة تسمية #${RENAME.id}: غير موجود — تخطّي.`);
    else {
      await db
        .update(students)
        .set({ name: RENAME.name, guardianName: RENAME.guardian, phone: RENAME.phone })
        .where(eq(students.id, RENAME.id));
      report.push(
        `✅ إعادة تسمية #${RENAME.id}: "${st.name}" ← "${RENAME.name}" · ولي الأمر ← ${RENAME.guardian} · الجوال ← ${RENAME.phone}`
      );
    }
  }

  // 3) نقل الطالب 22 إلى ثالث أول
  {
    const [st] = await db.select().from(students).where(eq(students.id, MOVE.id));
    if (!st) report.push(`⚠️ نقل #${MOVE.id}: غير موجود — تخطّي.`);
    else if (!norm(st.name).includes(norm(MOVE.expect)))
      report.push(`⛔ نقل #${MOVE.id}: الاسم الحالي "${st.name}" لا يطابق المتوقَّع "${MOVE.expect}" — تخطّي للسلامة.`);
    else if (!classFirst)
      report.push(`⚠️ نقل #${MOVE.id}: تعذّر تحديد فصل "ثالث أول".`);
    else {
      await db.update(students).set({ classId: classFirst.id }).where(eq(students.id, MOVE.id));
      report.push(`✅ نقل #${MOVE.id} (${st.name}): من "${classById.get(st.classId)}" ← إلى "${classFirst.name}"`);
    }
  }

  // 4) الحذف النهائي — بتحقّق الاسم أولًا
  for (const d of DELETES) {
    const [st] = await db.select().from(students).where(eq(students.id, d.id));
    if (!st) {
      report.push(`⚠️ حذف #${d.id}: غير موجود (ربما حُذف سابقًا) — تخطّي.`);
      continue;
    }
    if (!norm(st.name).includes(norm(d.expect))) {
      report.push(`⛔ حذف #${d.id}: الاسم الحالي "${st.name}" لا يطابق المتوقَّع "${d.expect}" — لم يُحذف (سلامة).`);
      continue;
    }
    await db.delete(students).where(eq(students.id, d.id));
    report.push(`🗑️ حُذف #${d.id} (${st.name}) وكل درجاته.`);
  }

  // الأعداد النهائية
  const after = await db.select({ id: students.id, classId: students.classId }).from(students);
  const counts = new Map<number, number>();
  for (const s of after) counts.set(s.classId, (counts.get(s.classId) || 0) + 1);
  const countStr = classes
    .map((c) => `${c.name}: ${counts.get(c.id) || 0}`)
    .join(" · ");
  report.push(`📊 الأعداد الآن — ${countStr} · المجموع ${after.length}`);

  await db
    .insert(settings)
    .values({ key: "_maint_report", value: JSON.stringify({ at: new Date().toISOString(), report }) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify({ at: new Date().toISOString(), report }) } });

  revalidatePath("/students");
  revalidatePath("/grades");
  revalidatePath("/maintenance");
}
