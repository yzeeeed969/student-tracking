export function fillTemplate(
  tpl: string,
  vars: Record<string, string>
): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^\d]/g, "");
  if (p.startsWith("00966")) p = p.slice(2);
  if (p.startsWith("0")) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(
    message
  )}`;
}
