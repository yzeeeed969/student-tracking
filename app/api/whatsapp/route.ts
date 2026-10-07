import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, contactLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { fillTemplate, waLink } from "@/lib/whatsapp";

// يسجّل الإرسال تلقائيًا ثم يحوّل إلى واتساب
export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = Number(url.searchParams.get("studentId"));
  const kind = url.searchParams.get("kind") || "عام";
  const lesson = url.searchParams.get("lesson") || "";
  const violation = url.searchParams.get("violation") || "";
  if (!studentId)
    return new NextResponse(null, { status: 303, headers: { Location: "/behavior" } });

  const [st] = await db.select().from(students).where(eq(students.id, studentId));
  if (!st)
    return new NextResponse(null, { status: 303, headers: { Location: "/behavior" } });

  const s = await getSettings();
  const base = {
    student: st.name,
    subject: s.subject || "",
    teacher: s.teacher || "",
    school: s.school || "",
    date: new Date().toLocaleDateString("ar-SA-u-nu-latn"),
    lesson,
    violation,
  };

  let tpl = s.tpl_taazeez || "";
  if (kind === "عدم الإجابة") tpl = s.tpl_homework || "";
  else if (kind === "مخالفة") tpl = s.tpl_violation || "";

  const message = fillTemplate(tpl, base);

  // التوثيق التلقائي
  await db.insert(contactLogs).values({
    studentId,
    kind,
    message: kind === "مخالفة" ? violation : lesson || kind,
  });

  return NextResponse.redirect(waLink(st.phone, message));
}
