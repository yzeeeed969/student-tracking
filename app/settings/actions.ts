"use server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { backOk } from "@/lib/flash";

async function setKey(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function saveSettings(formData: FormData) {
  const simple = [
    "teacher",
    "subject",
    "school",
    "w_quran",
    "w_oral_written",
    "w_homework",
    "w_participation",
    "homework_count",
    "tpl_taazeez",
    "tpl_homework",
    "tpl_homework_status",
    "tpl_violation",
  ];
  for (const k of simple) {
    const v = formData.get(k);
    if (v !== null) await setKey(k, String(v));
  }
  const behavior = String(formData.get("behavior_types") || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  await setKey("behavior_types", JSON.stringify(behavior));
  revalidatePath("/settings");
  revalidatePath("/behavior");
  revalidatePath("/grades");
  backOk(formData, "/settings", "تم حفظ الإعدادات");
}
