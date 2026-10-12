"use client";
import { useEffect, useState } from "react";

function todayKey() {
  const d = new Date();
  return `wa_sent_${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
}

type Stu = {
  id: number;
  name: string;
  phone: string;
  classId: number;
  className: string;
};

export default function WhatsappComposer({
  classes,
  students,
  templates = [],
}: {
  classes: { id: number; name: string }[];
  students: Stu[];
  templates: { label: string }[];
}) {
  const [cls, setCls] = useState<number | "all">("all");
  const [selected, setSelected] = useState<Set<number>>(
    new Set(students.map((s) => s.id))
  );
  const [mode, setMode] = useState<"custom" | "template">("custom");
  const [kind, setKind] = useState("تعزيز");
  const [text, setText] = useState("");
  const [gen, setGen] = useState<Stu[] | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [remainingOnly, setRemainingOnly] = useState(false);

  // تتبّع من أُرسل له اليوم (يبقى محفوظًا في المتصفح حتى لو أُغلقت الصفحة)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey());
      if (raw) setSent(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function persist(next: Set<number>) {
    try {
      localStorage.setItem(todayKey(), JSON.stringify([...next]));
    } catch {}
  }
  function markSent(id: number) {
    setSent((prev) => {
      const n = new Set(prev);
      n.add(id);
      persist(n);
      return n;
    });
  }
  function resetSent() {
    setSent(new Set());
    try {
      localStorage.removeItem(todayKey());
    } catch {}
  }

  const filtered = students.filter((s) => cls === "all" || s.classId === cls);

  function toggle(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    setGen(null);
  }
  function setAll(on: boolean) {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const s of filtered) on ? n.add(s.id) : n.delete(s.id);
      return n;
    });
    setGen(null);
  }

  function href(id: number) {
    if (mode === "custom")
      return `/api/whatsapp?studentId=${id}&custom=${encodeURIComponent(text)}`;
    if (kind.startsWith("tpl:"))
      return `/api/whatsapp?studentId=${id}&tpl=${kind.slice(4)}`;
    return `/api/whatsapp?studentId=${id}&kind=${encodeURIComponent(kind)}`;
  }

  function build() {
    if (mode === "custom" && !text.trim()) {
      alert("اكتب نص الرسالة أولًا.");
      return;
    }
    setGen(filtered.filter((s) => selected.has(s.id)));
  }

  function openAll() {
    (gen || []).forEach((r, i) => {
      if (r.phone && !sent.has(r.id)) {
        setTimeout(() => window.open(href(r.id), "_blank"), i * 400);
        markSent(r.id);
      }
    });
  }

  const chosenCount = filtered.filter((s) => selected.has(s.id)).length;

  return (
    <div className="space-y-4">
      {/* المستلمون */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold">المستلمون</h2>
          <select
            value={cls === "all" ? "all" : String(cls)}
            onChange={(e) => {
              setCls(e.target.value === "all" ? "all" : Number(e.target.value));
              setGen(null);
            }}
            className="text-sm"
          >
            <option value="all">كل الفصول</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setAll(true)} className="text-brand">
            تحديد الكل
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-muted">
            إلغاء التحديد
          </button>
          <span className="text-muted">المحدّدون: {chosenCount}</span>
        </div>
        <div className="max-h-56 overflow-auto grid sm:grid-cols-2 gap-1">
          {filtered.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 text-sm rounded-md bg-card/60 px-2 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
              />
              <span className="flex-1">{s.name}</span>
              {!s.phone && <span className="text-muted text-xs">لا جوال</span>}
            </label>
          ))}
        </div>
      </div>

      {/* الرسالة */}
      <div className="card p-4 space-y-3">
        <h2 className="font-bold">الرسالة</h2>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={mode === "custom"}
              onChange={() => {
                setMode("custom");
                setGen(null);
              }}
            />
            نص مخصّص
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={mode === "template"}
              onChange={() => {
                setMode("template");
                setGen(null);
              }}
            />
            قالب جاهز
          </label>
        </div>

        {mode === "custom" ? (
          <div className="space-y-1">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setGen(null);
              }}
              rows={6}
              placeholder="اكتب نص الرسالة هنا…"
              className="w-full"
            />
            <div className="text-muted text-xs">
              يمكنك استخدام متغيّرات تُستبدل تلقائيًا لكل طالب:{" "}
              {"{student} {subject} {teacher} {school} {date}"}
            </div>
          </div>
        ) : (
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setGen(null);
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
        )}

        <button type="button" onClick={build} className="btn">
          تجهيز روابط الإرسال ({chosenCount})
        </button>
      </div>

      {/* روابط الإرسال مع التتبّع */}
      {gen &&
        (() => {
          const sentCount = gen.filter((r) => sent.has(r.id)).length;
          const remaining = gen.length - sentCount;
          const list = remainingOnly ? gen.filter((r) => !sent.has(r.id)) : gen;
          return (
            <div className="card p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-bold">
                  روابط الإرسال —{" "}
                  <span className="text-brand">تم: {sentCount}</span> ·{" "}
                  <span className="text-amber-600">تبقّى: {remaining}</span>
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remainingOnly}
                      onChange={(e) => setRemainingOnly(e.target.checked)}
                    />
                    المتبقّون فقط
                  </label>
                  <button
                    type="button"
                    onClick={openAll}
                    className="btn-ghost btn text-xs"
                    title="قد يحجب المتصفح فتح نوافذ متعددة"
                  >
                    فتح الكل
                  </button>
                  <button
                    type="button"
                    onClick={resetSent}
                    className="text-muted"
                  >
                    تصفير التتبّع
                  </button>
                </div>
              </div>
              <div className="text-muted text-xs">
                أرسِل على مهلك خلال اليوم — ما تضغط عليه يُعلَّم «تم»، ويبقى محفوظًا
                حتى لو أغلقت الصفحة.
              </div>
              <div className="max-h-96 overflow-auto space-y-1">
                {list.map((r) => {
                  const done = sent.has(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-1.5 ${
                        done ? "bg-card/30 opacity-70" : "bg-card/60"
                      }`}
                    >
                      <span className="font-medium">{r.name}</span>
                      {!r.phone ? (
                        <span className="text-muted text-xs">لا جوال</span>
                      ) : done ? (
                        <span className="flex items-center gap-2">
                          <span className="text-brand text-xs">✓ تم</span>
                          <a
                            href={href(r.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSent(r.id)}
                            className="text-muted text-xs underline"
                          >
                            إعادة
                          </a>
                        </span>
                      ) : (
                        <a
                          href={href(r.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markSent(r.id)}
                          className="rounded-md bg-green-600 text-white text-xs px-3 py-1 hover:opacity-90"
                        >
                          ✉ إرسال
                        </a>
                      )}
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <div className="text-center text-brand text-sm py-2">
                    🎉 تم الإرسال للجميع.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
