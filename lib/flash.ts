import { redirect } from "next/navigation";

// يعيد التوجيه إلى الصفحة نفسها مع رسالة نجاح تظهر كإشعار (toast)
export function backOk(
  formData: FormData,
  fallback: string,
  msg: string
): never {
  const back = String(formData.get("_back") || fallback);
  const sep = back.includes("?") ? "&" : "?";
  redirect(`${back}${sep}ok=${encodeURIComponent(msg)}`);
}
