import { readFileSync } from "fs";
import { join } from "path";

// صفحة البطاقات التفاعلية ثلاثية الأبعاد — عامة (بلا تسجيل دخول)
// تُقرأ من ملف ثابت في public/cards.html وتُقدَّم على مسار نظيف /cards
export const dynamic = "force-dynamic";

let cached: string | null = null;

export function GET() {
  if (cached === null) {
    cached = readFileSync(join(process.cwd(), "public", "cards.html"), "utf8");
  }
  return new Response(cached, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
