import "dotenv/config";
import { db } from "../db";
import {
  classRooms,
  students,
  homeworkMarks,
  settings,
} from "../db/schema";
import { readFileSync } from "fs";
import { eq } from "drizzle-orm";

type SeedStudent = {
  code: string;
  name: string;
  class: string;
  guardian: string;
  phone: string;
  quran: number | null;
  oral_written: number | null;
  homework: (number | null)[];
};

async function main() {
  const data: SeedStudent[] = JSON.parse(
    readFileSync(process.argv[2] || "scripts/seed_students.json", "utf8")
  );

  // الفصول
  const classNames = Array.from(new Set(data.map((s) => s.class)));
  const classMap = new Map<string, number>();
  for (let i = 0; i < classNames.length; i++) {
    const name = classNames[i];
    const existing = await db
      .select()
      .from(classRooms)
      .where(eq(classRooms.name, name));
    if (existing.length) {
      classMap.set(name, existing[0].id);
    } else {
      const [row] = await db
        .insert(classRooms)
        .values({ name, order: i })
        .returning();
      classMap.set(name, row.id);
    }
  }

  // الطلاب
  let count = 0;
  for (const s of data) {
    const [stu] = await db
      .insert(students)
      .values({
        code: s.code,
        name: s.name,
        guardianName: s.guardian || "",
        phone: s.phone || "",
        classId: classMap.get(s.class)!,
        quran: s.quran ?? null,
        oralWritten: s.oral_written ?? null,
      })
      .onConflictDoNothing({ target: students.code })
      .returning();
    if (!stu) continue;
    count++;
    // الواجبات
    const marks = s.homework
      .map((score, idx) => ({ studentId: stu.id, num: idx + 1, score }))
      .filter((m) => m.score !== null && m.score !== undefined);
    if (marks.length) await db.insert(homeworkMarks).values(marks);
  }

  // الإعدادات الافتراضية
  const defaults: Record<string, string> = {
    teacher: "يزيد العنزي",
    subject: "الدراسات الإسلامية",
    school: "الرمال الابتدائية الثالثة (مسائية)",
    w_quran: "20",
    w_oral_written: "40",
    w_homework: "18",
    w_participation: "22",
    homework_count: "18",
    behavior_types: JSON.stringify([
      "نسي القلم",
      "نسي الكتاب",
      "شتم زميله",
      "ضرب زميله",
      "عدم الالتزام بالتعليمات",
      "مقاطعة المعلم",
      "إزعاج الزملاء",
      "القيام دون إذن",
      "مخالفة أخرى",
    ]),
    tpl_taazeez:
      "السلام عليكم ورحمة الله وبركاته\nالمكرم ولي أمر الطالب\n*{student}*\nأود إبلاغكم بأن ابنكم يُعد من المشاركين المتميزين في مادة {subject}\nويُظهر اهتماماً وتفاعلاً إيجابياً داخل الصف.\nنشكر لكم متابعته وحرصكم.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
    tpl_homework:
      "السلام عليكم ورحمة الله وبركاته\nالمكرم ولي أمر الطالب\n*{student}*\nأفيدكم بأن ابنكم لم يجب على التقاويم والأنشطة لدرس: {lesson}\nنأمل متابعته والحرص على ذلك أولًا بأول.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
    tpl_violation:
      "السلام عليكم ورحمة الله وبركاته\nتم تسجيل مخالفة سلوكية على الطالب:\n*{student}*\nوالمتمثلة في:\n{violation}\nوذلك بتاريخ: {date}\nنأمل حثه على الانضباط والتقيد بالنظام.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  console.log(`زُرع ${count} طالبًا، و${classNames.length} فصلًا، والإعدادات.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
