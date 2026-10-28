"use server";
import { db } from "@/db";
import { students, classRooms } from "@/db/schema";
import { eq, asc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// درجات ملف الإكسل (التحريري الأول) — الدرجة من 20
const FILE_SCORES: { name: string; cls: string; score: number }[] = [
  { name: "محمد بندر البقمي", cls: "ثالث أول", score: 20 },
  { name: "عساف بن فارس الحيسوني", cls: "ثالث أول", score: 20 },
  { name: "خالد بدر مبارك", cls: "ثالث أول", score: 20 },
  { name: "نهار محمد العتيبي", cls: "ثالث أول", score: 20 },
  { name: "أمير محمد المطيري", cls: "ثالث أول", score: 20 },
  { name: "راشد رعد الحارثي", cls: "ثالث ثاني", score: 20 },
  { name: "يزيد ماجد العتيبي", cls: "ثالث ثاني", score: 20 },
  { name: "اوس طارق سليمان المزيرعي", cls: "ثالث أول", score: 20 },
  { name: "مقرن خالد العتيبي", cls: "ثالث أول", score: 20 },
  { name: "عمر عبد المجيد العتيبي", cls: "ثالث أول", score: 20 },
  { name: "بدر خالد العسيري", cls: "ثالث ثاني", score: 20 },
  { name: "موسى احمد البارقي", cls: "ثالث أول", score: 20 },
  { name: "فيصل راكان المطيري", cls: "ثالث أول", score: 20 },
  { name: "حزام محمد فهاد القحطاني", cls: "ثالث أول", score: 20 },
  { name: "عبد العزيز خميس بن عبيدالله", cls: "ثالث أول", score: 20 },
  { name: "محمد بندر البقمي", cls: "ثالث أول", score: 20 },
  { name: "بسام خالد الزهراني", cls: "ثالث أول", score: 20 },
  { name: "نواف علي العرجاني", cls: "ثالث أول", score: 20 },
  { name: "اوس", cls: "ثالث أول", score: 20 },
  { name: "سالم ظافر  ناصر اليامي", cls: "ثالث أول", score: 20 },
  { name: "عبدالعزيز مهلهل العبدلي", cls: "ثالث أول", score: 20 },
  { name: "نايف منصور العتيبي", cls: "ثالث أول", score: 20 },
  { name: "هادي شجاع البقمي", cls: "ثالث أول", score: 20 },
  { name: "راكان عائض السبيعي", cls: "ثالث أول", score: 20 },
  { name: "نايف بندر الحربي", cls: "ثالث أول", score: 20 },
  { name: "عبدالعزيز فهد الحربي", cls: "ثالث أول", score: 20 },
  { name: "خالد بن سلطان بن سعيد الحارثي", cls: "ثالث أول", score: 20 },
  { name: "يوسف حمدي العتيبي", cls: "ثالث أول", score: 20 },
  { name: "عبدالرحمن فيصل", cls: "ثالث أول", score: 20 },
  { name: "خالد بلال ابو عمر", cls: "ثالث ثاني", score: 20 },
  { name: "عدي طارق  المسبحي", cls: "ثالث ثاني", score: 20 },
  { name: "راشد رعد الحارثي", cls: "ثالث ثاني", score: 20 },
  { name: "عبدالعزيز فيصل العتيبي", cls: "ثالث ثاني", score: 20 },
  { name: "بدر خالد العنزي", cls: "ثالث ثاني", score: 20 },
  { name: "بدر فراس الغامدي", cls: "ثالث ثاني", score: 20 },
  { name: "مطلق كايد العتيبي", cls: "ثالث ثاني", score: 20 },
  { name: "مشعل احمد مهيدي العنزي", cls: "ثالث ثاني", score: 20 },
  { name: "عمر يونس محمد عبدالمعين", cls: "ثالث ثاني", score: 20 },
  { name: "يوسف عبد الرحمن التركي", cls: "ثالث ثاني", score: 20 },
  { name: "علي سعد العتيبي", cls: "ثالث ثاني", score: 20 },
  { name: "عبد العزيز نواف نزال عزران", cls: "ثالث ثاني", score: 20 },
  { name: "فهد سلطان", cls: "ثالث ثاني", score: 20 },
  { name: "يزيد ماجد العتيبي", cls: "ثالث ثاني", score: 20 },
  { name: "تيم محمد حسن ال سعيد", cls: "ثالث ثاني", score: 20 },
  { name: "سلطان فراس السعدي", cls: "ثالث ثاني", score: 19.75 },
  { name: "أحمد زهير بابكر", cls: "ثالث ثاني", score: 19.5 },
  { name: "عمر عبدالله بن عفي", cls: "ثالث ثاني", score: 19.35 },
  { name: "عرفات محمد عبدالله معيض", cls: "ثالث أول", score: 19 },
  { name: "موسى علي البارقي", cls: "ثالث أول", score: 19 },
  { name: "رعد عبدالله المطيري", cls: "ثالث ثاني", score: 19 },
  { name: "عيد حمد عيد المنصور", cls: "ثالث ثاني", score: 19 },
  { name: "محمد سامي السبع", cls: "ثالث ثاني", score: 19 },
  { name: "نواف علي محمد احمد الذرحاني", cls: "ثالث أول", score: 19 },
  { name: "نياف مطر المطيري", cls: "ثالث أول", score: 19 },
  { name: "عبدالله نايف القحطانى", cls: "ثالث ثاني", score: 19 },
  { name: "قصي ياسر عيد", cls: "ثالث ثاني", score: 19 },
  { name: "فيصل سلطان مطيري", cls: "ثالث ثاني", score: 19 },
  { name: "رعد عبدالله المطيري", cls: "ثالث ثاني", score: 19 },
  { name: "ريان ماجد الحربي", cls: "ثالث ثاني", score: 19 },
  { name: "عبداللطيف ابراهيم الهنداس", cls: "ثالث ثاني", score: 19 },
  { name: "حسين عبدالله الدوسري،", cls: "ثالث أول", score: 18 },
  { name: "عامر عبد العزيز العتيبي", cls: "ثالث ثاني", score: 17.7 },
  { name: "نايف ممدوح نواف العتيبي", cls: "ثالث ثاني", score: 17.5 },
  { name: "أيمن ياسين", cls: "ثالث أول", score: 17 },
  { name: "عرفات محمد عبدالله معيض", cls: "ثالث أول", score: 14 },
  { name: "غيث", cls: "ثالث أول", score: 13 },
  { name: "محمود عبدالهادي", cls: "ثالث أول", score: 11 },
  { name: "عبدالله محمد العتيبي", cls: "ثالث ثاني", score: 11 },
  { name: "ايمن ياسين", cls: "ثالث أول", score: 7 },
];

function norm(s: string): string {
  return (s || "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/عبد\s+/g, "عبد")
    .replace(/[^؀-ۿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function toks(s: string): string[] {
  return norm(s)
    .split(" ")
    .filter((t) => t && t !== "بن" && t !== "ابن");
}
function clsIsFirst(name: string): boolean {
  // "ثالث أول" أو "ثالث 1"
  return /أول|اول|\b1\b|١/.test(name) && !/ثاني|ثانى|\b2\b|٢/.test(name);
}

export type PlanItem = {
  id: number;
  name: string;
  className: string;
  classIsFirst: boolean;
  fileName: string;
  fileCls: string;
  score20: number;
  score10: number;
  wrongLink: boolean;
};

export async function getPlan() {
  const classes = await db
    .select()
    .from(classRooms)
    .orderBy(asc(classRooms.order), asc(classRooms.id));
  const firstClassId = classes[0]?.id ?? -1;
  const clsName = new Map(classes.map((c) => [c.id, c.name] as const));

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      classId: students.classId,
      written1: students.written1,
    })
    .from(students)
    .where(isNull(students.written1))
    .orderBy(asc(students.classId));

  const plan: PlanItem[] = [];
  const unmatched: { name: string; className: string }[] = [];

  for (const st of rows) {
    const stToks = toks(st.name);
    // طابق كل مدخلات الملف التي كل كلماتها داخل اسم الطالب
    const matches = FILE_SCORES.filter((f) => {
      const ft = toks(f.name);
      return ft.length > 0 && ft.every((t) => stToks.includes(t));
    });
    if (matches.length === 0) {
      unmatched.push({ name: st.name, className: clsName.get(st.classId) || "" });
      continue;
    }
    // عند التكرار: أعلى درجة
    const best = matches.reduce((a, b) => (b.score > a.score ? b : a));
    const isFirst = st.classId === firstClassId;
    const fileFirst = clsIsFirst(best.cls);
    plan.push({
      id: st.id,
      name: st.name,
      className: clsName.get(st.classId) || "",
      classIsFirst: isFirst,
      fileName: best.name,
      fileCls: best.cls,
      score20: best.score,
      score10: Math.round((best.score / 2) * 100) / 100,
      wrongLink: isFirst !== fileFirst,
    });
  }
  return { plan, unmatched };
}

export async function applyPlan() {
  const { plan } = await getPlan();
  let applied = 0;
  for (const p of plan) {
    // أمان: لا نكتب إلا إذا ما زالت فارغة
    await db
      .update(students)
      .set({ written1: p.score10 })
      .where(eq(students.id, p.id));
    applied++;
  }
  revalidatePath("/record");
  revalidatePath("/reports");
  revalidatePath("/examfill");
  return applied;
}
