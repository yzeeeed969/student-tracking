"use client";

type Opt = { label: string; kind?: string; tpl?: number };

// قائمة منسدلة لإرسال رسالة واتساب للطالب باختيار قالب (مبني أو مخصّص)
export default function SendMenu({
  studentId,
  options,
}: {
  studentId: number;
  options: Opt[];
}) {
  if (!options.length) return null;
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const i = Number(e.target.value);
        const o = options[i];
        e.currentTarget.value = "";
        if (!o) return;
        const q =
          o.tpl !== undefined
            ? `tpl=${o.tpl}`
            : `kind=${encodeURIComponent(o.kind || "عام")}`;
        window.open(`/api/whatsapp?studentId=${studentId}&${q}`, "_blank");
      }}
      className="text-xs text-green-700 bg-transparent"
      title="إرسال رسالة واتساب"
    >
      <option value="">واتساب…</option>
      {options.map((o, i) => (
        <option key={i} value={i}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
