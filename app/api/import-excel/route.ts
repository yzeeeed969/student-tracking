import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { classRooms, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";
import { normalizePhone } from "@/lib/whatsapp";

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

// تطبيع عام (للأسماء والعناوين)
function norm(s: string) {
  return String(s || "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// يختار قيمة من صف حسب عدة أسماء محتملة للعمود
function pick(row: Record<string, unknown>, keys: string[]): string {
  const map = new Map<string, unknown>();
  for (const k of Object.keys(row)) map.set(norm(k).replace(/\s+/g, ""), row[k]);
  for (const cand of keys) {
    const v = map.get(norm(cand).replace(/\s+/g, ""));
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

const NAME_KEYS = ["name", "الاسم", "اسم", "اسم الطالب", "الطالب", "studentname", "student"];
const CLASS_KEYS = ["class", "الفصل", "الصف", "classname", "section", "الشعبة"];
const GUARDIAN_KEYS = ["guardian", "ولي الأمر", "ولي الامر", "اسم ولي الأمر", "اسم ولي الامر", "parent", "الاب"];
const PHONE_KEYS = ["phone", "الجوال", "الهاتف", "جوال", "جوال ولي الأمر", "mobile", "رقم", "رقم ولي الأمر", "رقم الجوال", "الرقم"];

export async function POST(req: Request) {
  if (!(await isAuthed())) return redirectTo("/login");

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return redirectTo("/import?e=nofile");

  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return redirectTo("/import?e=badexcel");
  }

  // تحميل الفصول والطلاب الحاليين
  const classList = await db.select().from(classRooms);
  const classByNorm = new Map(classList.map((c) => [norm(c.name), c]));
  const allStudents = await db.select().from(students);
  const studentByName = new Map<string, (typeof allStudents)[number]>();
  for (const s of allStudents) {
    const key = norm(s.name);
    if (!studentByName.has(key)) studentByName.set(key, s);
  }
  const usedCodes = new Set(allStudents.map((s) => s.code));

  async function resolveClassId(name: string): Promise<number> {
    const key = norm(name);
    const ex = classByNorm.get(key);
    if (ex) return ex.id;
    const [c] = await db
      .insert(classRooms)
      .values({ name: name.trim(), order: classByNorm.size })
      .returning();
    classByNorm.set(key, c);
    return c.id;
  }

  function nextCode(classNameForPrefix: string): string {
    const prefix = classNameForPrefix.includes("2") ? "2" : "1";
    let n = allStudents
      .map((s) => s.code)
      .concat(Array.from(usedCodes))
      .filter((c) => c.startsWith(prefix + "-"))
      .map((c) => parseInt(c.slice(prefix.length + 1), 10))
      .filter((x) => !Number.isNaN(x))
      .reduce((mx, x) => Math.max(mx, x), 0);
    let code: string;
    do {
      n += 1;
      code = `${prefix}-${String(n).padStart(2, "0")}`;
    } while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  }

  let updated = 0;
  let added = 0;
  let skipped = 0;

  for (const r of rows) {
    const name = pick(r, NAME_KEYS);
    if (!name) {
      skipped++;
      continue;
    }
    const className = pick(r, CLASS_KEYS);
    const guardian = pick(r, GUARDIAN_KEYS);
    const phoneRaw = pick(r, PHONE_KEYS);
    const phone = phoneRaw ? normalizePhone(phoneRaw) : "";

    const existing = studentByName.get(norm(name));
    if (existing) {
      const set: Record<string, unknown> = {};
      if (className) set.classId = await resolveClassId(className);
      if (guardian) set.guardianName = guardian;
      if (phone) set.phone = phone;
      if (Object.keys(set).length) {
        await db.update(students).set(set).where(eq(students.id, existing.id));
        updated++;
      } else {
        skipped++;
      }
    } else {
      if (!className) {
        skipped++;
        continue;
      }
      const classId = await resolveClassId(className);
      const code = nextCode(className);
      const [ins] = await db
        .insert(students)
        .values({ code, name: name.trim(), classId, guardianName: guardian, phone })
        .returning();
      if (ins) studentByName.set(norm(name), ins);
      added++;
    }
  }

  return redirectTo(
    `/students?ok=${encodeURIComponent(
      `اكتمل الاستيراد: حُدّث ${updated}، أُضيف ${added}، تُخطّي ${skipped}`
    )}`
  );
}
