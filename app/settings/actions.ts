"use server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { backOk } from "@/lib/flash";
import { PARENT_VIEW_KEYS } from "@/lib/settings";

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
    "custom_templates",
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

  // مفاتيح الظهور في نافذة ولي الأمر (مربّع اختيار: يرسل "1" عند التفعيل، ولا شيء عند الإلغاء)
  for (const k of PARENT_VIEW_KEYS) {
    await setKey(k, formData.get(k) ? "1" : "0");
  }

  revalidatePath("/settings");
  revalidatePath("/behavior");
  revalidatePath("/grades");
  revalidatePath("/showcase");
  backOk(formData, "/settings", "تم حفظ الإعدادات");
}
