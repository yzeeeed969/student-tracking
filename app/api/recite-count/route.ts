import { NextResponse } from "next/server";
import { db } from "@/db";
import { recitations } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// عدد التسميعات بانتظار الرصد (للمعلم — محميّ عبر middleware)
export async function GET() {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(recitations);
  return NextResponse.json({ count: Number(row?.c ?? 0) });
}
