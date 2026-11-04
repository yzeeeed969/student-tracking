import { NextResponse } from "next/server";
import { db } from "@/db";
import { evidenceFiles } from "@/db/schema";
import { isAuthed } from "@/lib/auth";

const MAX = 15 * 1024 * 1024; // 15 ميغابايت لكل ملف

function back(n: number, q: string) {
  return new NextResponse(null, { status: 303, headers: { Location: `/evidence/${n}?${q}` } });
}

// رفع ملف أو عدة ملفات (صور/PDF) شاهدًا لبند من البنود
export async function POST(req: Request) {
  if (!(await isAuthed()))
    return new NextResponse(null, { status: 303, headers: { Location: "/login" } });

  const form = await req.formData();
  const element = Number(form.get("element"));
  if (!Number.isInteger(element) || element < 1 || element > 11)
    return new NextResponse("bad element", { status: 400 });

  const note = String(form.get("note") || "").trim().slice(0, 500);
  const customTitle = String(form.get("title") || "").trim();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return back(element, "e=nofile");

  let saved = 0;
  for (const file of files) {
    if (file.size > MAX) continue;
    const buf = Buffer.from(await file.arrayBuffer());
    const base = file.name.replace(/\.[^.]+$/, "");
    const title = customTitle && files.length === 1 ? customTitle : base || "شاهد";
    await db.insert(evidenceFiles).values({
      element,
      title: title.slice(0, 200),
      note,
      mime: file.type || "application/octet-stream",
      size: buf.length,
      data: buf,
    });
    saved++;
  }
  if (saved === 0) return back(element, "e=big");
  return back(element, `ok=${encodeURIComponent(`تم رفع ${saved} ملف`)}`);
}
