import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const DEFAULT_SETTINGS: Record<string, string> = {
  teacher: "",
  subject: "الدراسات الإسلامية",
  teacher_whatsapp: "0559695793",
  school: "",
  w_quran: "20",
  w_oral_written: "40",
  w_homework: "18",
  w_participation: "13",
  w_worksheets: "9",
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
  positive_types: JSON.stringify([
    "طالب متميز",
    "خُلق حسن وتعامل راقٍ",
    "تفوق دراسي",
    "حفظ متقن",
    "مشاركة فعّالة",
    "تحسّن ملحوظ",
    "مساعدة الزملاء",
    "انضباط والتزام",
  ]),
  tpl_taazeez:
    "السلام عليكم ورحمة الله وبركاته\nالمكرم ولي أمر الطالب\n*{student}*\nأود إبلاغكم بأن ابنكم يُعد من المشاركين المتميزين في مادة {subject}\nويُظهر اهتماماً وتفاعلاً إيجابياً داخل الصف.\nنشكر لكم متابعته وحرصكم.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
  tpl_homework:
    "السلام عليكم ورحمة الله وبركاته\nالمكرم ولي أمر الطالب\n*{student}*\nأفيدكم بأن ابنكم لم يجب على التقاويم والأنشطة لدرس: {lesson}\nنأمل متابعته والحرص على ذلك أولًا بأول.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
  tpl_homework_status:
    "السلام عليكم ورحمة الله وبركاته\nالمكرم ولي أمر الطالب\n*{student}*\nفيما يخص التقاويم والأنشطة في مادة {subject}:\n- التقاويم التي تم حلها: {solved}\n- التقاويم التي لم تُحل: {unsolved}\nنأمل متابعته والحرص على حلها أولًا بأول.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
  tpl_violation:
    "السلام عليكم ورحمة الله وبركاته\nتم تسجيل مخالفة سلوكية على الطالب:\n*{student}*\nوالمتمثلة في:\n{violation}\nوذلك بتاريخ: {date}\nنأمل حثه على الانضباط والتقيد بالنظام.\n*معلم مادة {subject}*\n*{teacher}*\nمدرسة {school}",
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL?.includes("localhost") ||
      process.env.DATABASE_URL?.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });

  // إدراج الإعدادات الافتراضية إن لم تكن موجودة (لا يُحدّث ما عدّله المعلم)
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }

  // نقل 9 درجات من المشاركة إلى أوراق العمل (مرة واحدة، فقط إن كانت المشاركة لا تزال 22)
  await pool.query(
    `UPDATE settings SET value='13' WHERE key='w_participation' AND value='22'`
  );

  // بذرة 18 ورقة عمل (درس لكل ورقة) لكل فصل إن لم تكن موجودة
  const classRows = (
    await pool.query(`SELECT id FROM class_rooms ORDER BY "order", id`)
  ).rows as { id: number }[];
  for (const c of classRows) {
    for (let n = 1; n <= 18; n++) {
      await pool.query(
        `INSERT INTO worksheets (class_id, num, title, links, published, "order")
         VALUES ($1, $2, $3, '[]', false, $2)
         ON CONFLICT (class_id, num) DO NOTHING`,
        [c.id, n, `الدرس ${n}`]
      );
    }
  }

  console.log("✓ تم تهيئة قاعدة البيانات (الجداول والإعدادات جاهزة)");
  await pool.end();
}

main().catch((e) => {
  console.error("فشل تهيئة قاعدة البيانات:", e);
  process.exit(1);
});
