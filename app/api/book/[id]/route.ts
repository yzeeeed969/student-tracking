import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed()))
    return new NextResponse("unauthorized", { status: 401 });
  const { id } = await params;
  const [b] = await db.select().from(books).where(eq(books.id, Number(id)));
  if (!b) return new NextResponse("not found", { status: 404 });
  const data = b.data as Buffer;
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": b.mime || "application/pdf",
      "Content-Disposition": `inline; filename="book-${id}.pdf"`,
      "Content-Length": String(data.length),
    },
  });
}
