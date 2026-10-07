import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const DEFAULT_SETTINGS: Record<string, string> = {
  teacher: "",
  subject: "الدراسات الإسلامية",
  school: "",
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

  console.log("✓ تم تهيئة قاعدة البيانات (الجداول والإعدادات جاهزة)");
  await pool.end();
}

main().catch((e) => {
  console.error("فشل تهيئة قاعدة البيانات:", e);
  process.exit(1);
});
