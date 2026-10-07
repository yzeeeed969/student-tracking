import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export function weights(s: Record<string, string>) {
  return {
    quran: Number(s.w_quran ?? 20),
    oralWritten: Number(s.w_oral_written ?? 40),
    homework: Number(s.w_homework ?? 18),
    participation: Number(s.w_participation ?? 22),
  };
}
