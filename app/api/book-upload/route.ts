import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { isAuthed } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAuthed()))
    return new NextResponse(null, { status: 303, headers: { Location: "/login" } });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title =
    String(form.get("title") || "").trim() || (file ? file.name : "كتاب");
  if (!file)
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/library?view=books&e=nofile" },
    });

  const buf = Buffer.from(await file.arrayBuffer());
  await db.insert(books).values({
    title,
    mime: file.type || "application/pdf",
    size: buf.length,
    data: buf,
  });

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: `/library?view=books&ok=${encodeURIComponent(
        "تمت إضافة الكتاب"
      )}`,
    },
  });
}
