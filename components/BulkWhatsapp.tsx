"use client";
import { useState } from "react";
import { useSelectedIds } from "./useSelection";

type Row = { id: number; name: string; phone: string };

// إرسال واتساب جماعي: يحدّد المعلم الطلاب ثم يختار قالبًا، فتظهر روابط إرسال لكل طالب.
// (واتساب لا يسمح بالإرسال التلقائي لعدة أرقام، فنوفّر رابطًا لكل طالب يُفتح بضغطة.)
export default function BulkWhatsapp({
  templates = [],
}: {
  templates: { label: string }[];
}) {
  const { ids } = useSelectedIds();
  const [kind, setKind] = useState("تعزيز");
  const [list, setList] = useState<Row[] | null>(null);

  if (!ids.length) return null;

  function hrefFor(id: number) {
    return kind.startsWith("tpl:")
      ? `/api/whatsapp?studentId=${id}&tpl=${kind.slice(4)}`
      : `/api/whatsapp?studentId=${id}&kind=${encodeURIComponent(kind)}`;
  }

  function build() {
    const rows = [
      ...document.querySelectorAll<HTMLInputElement>(".rowchk:checked"),
    ].map((c) => ({
      id: Number(c.value),
      name: c.getAttribute("data-name") || "",
      phone: c.getAttribute("data-phone") || "",
    }));
    setList(rows);
  }

  function openAll() {
    (list || []).forEach((r, i) => {
      if (r.phone) setTimeout(() => window.open(hrefFor(r.id), "_blank"), i * 400);
    });
  }

  return (
    <div className="card p-3 space-y-2 border-2 border-green-600/60">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-sm">
          إرسال واتساب للمحدّدين: {ids.length}
        </span>
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setList(null);
          }}
          className="text-sm"
        >
          <option value="تعزيز">تعزيز</option>
          <option value="واجبات">حالة الواجبات</option>
          {templates.map((t, i) => (
            <option key={i} value={`tpl:${i}`}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={build} className="btn text-xs">
          تجهيز روابط الإرسال
        </button>
      </div>

      {list && (
        <div className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-muted text-xs">
              اضغط «إرسال» بجانب كل طالب لفتح محادثته.
            </span>
            <button
              type="button"
              onClick={openAll}
              className="btn-ghost btn text-xs"
              title="قد يحجب المتصفح فتح نوافذ متعددة"
            >
              فتح الكل (قد يحجبه المتصفح)
            </button>
          </div>
          <div className="max-h-72 overflow-auto space-y-1">
            {list.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm rounded-md bg-card/60 px-3 py-1.5"
              >
                <span className="font-medium">{r.name}</span>
                {r.phone ? (
                  <a
                    href={hrefFor(r.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-green-600 text-white text-xs px-3 py-1 hover:opacity-90"
                  >
                    ✉ إرسال
                  </a>
                ) : (
                  <span className="text-muted text-xs">لا جوال</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
