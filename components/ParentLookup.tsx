"use client";

import { useActionState } from "react";
import { lookupParent, type LookupState, type ParentReport } from "@/app/showcase/actions";

const initial: LookupState = { ok: false };

export default function ParentLookup({ teacherWa }: { teacherWa?: string }) {
  const [state, formAction, pending] = useActionState(lookupParent, initial);

  return (
    <div className="card p-5 space-y-4 border-2 border-brand/30">
      <div>
        <h2 className="font-bold text-lg text-brand">استعلام ولي الأمر</h2>
        <p className="text-muted text-sm mt-1">
          أدخل رقم جوالك المسجّل لدى المعلم لعرض تقرير ابنك.
        </p>
      </div>

      <form action={formAction} className="flex gap-2 items-center flex-wrap">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder="05XXXXXXXX"
          required
          className="flex-1 min-w-48 text-center"
        />
        <button className="btn" disabled={pending}>
          {pending ? "جارٍ البحث…" : "عرض بيانات ابني"}
        </button>
      </form>

      {state.message && !state.ok && (
        <div className="text-red-500 text-sm">{state.message}</div>
      )}

      {state.ok && state.reports && (
        <div className="space-y-5">
          {state.reports.map((r, i) => (
            <ReportCard key={i} r={r} show={state.show} />
          ))}
        </div>
      )}

      {/* التواصل مع المعلم عبر واتساب فقط */}
      {teacherWa && (
        <div className="border-t border-[var(--border)] pt-4 text-center space-y-2">
          <a
            href={`https://wa.me/${teacherWa}?text=${encodeURIComponent(
              "السلام عليكم ورحمة الله، لدي استفسار بخصوص ابني."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white font-bold px-5 py-2.5 hover:opacity-90"
          >
            💬 تواصل مع المعلم عبر واتساب
          </a>
          <p className="text-xs text-muted">
            التواصل عبر واتساب فقط — يُرجى عدم الاتصال هاتفيًا.
          </p>
        </div>
      )}
    </div>
  );
}

function ReportCard({
  r,
  show,
}: {
  r: ParentReport;
  show: LookupState["show"];
}) {
  const s = show ?? {
    quran: true,
    homework: true,
    examW1: true,
    examW2: false,
    examO1: false,
    examO2: false,
    participation: false,
    total: false,
    notes: false,
  };

  const reachedIdx = r.currentSurahIdx; // -1 إن لم يبدأ
  const reachedCount = reachedIdx + 1; // عدد السور التي وصل إليها الفصل
  const quranDone = r.surahs.filter((x) => x.done).length;
  const nextIdx = r.surahs.findIndex((x, idx) => idx <= reachedIdx && !x.done);
  const nextSurah = nextIdx >= 0 ? r.surahs[nextIdx] : null;
  const curHw = r.currentHw;
  const reachedSurahName =
    s.quran && reachedIdx >= 0 && r.surahs[reachedIdx]
      ? r.surahs[reachedIdx].name
      : null;

  return (
    <div className="rounded-xl bg-brandsoft/40 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        <div className="font-bold text-lg">{r.name}</div>
        <div className="text-muted text-sm">{r.className}</div>
      </div>

      {/* إلى أين وصل الفصل */}
      {(s.homework || s.quran) && (
        <div className="rounded-lg bg-brand text-white px-3 py-2 text-center">
          <div className="text-sm">
            📍 وصل الفصل حتى:{" "}
            {s.homework && (
              <b>{curHw > 0 ? `الواجب ${curHw}` : "لم تبدأ الواجبات"}</b>
            )}
            {s.homework && reachedSurahName && " · "}
            {reachedSurahName && <b>سورة {reachedSurahName}</b>}
          </div>
          <div className="text-[11px] opacity-90 mt-0.5">
            لا حاجة لحلّ أو تسميع ما بعد ذلك — فالفصل لم يصل إليه بعد.
          </div>
        </div>
      )}

      <div className="text-xs text-brand bg-brandsoft/60 rounded-md px-3 py-1.5 text-center">
        👇 اضغط على أي بند بالأسفل لعرض تفاصيله
      </div>

      {/* ملخّص التقدّم */}
      {(s.quran || s.homework) && (
        <div className="space-y-3 rounded-lg bg-card/60 p-3">
          {s.quran && (
            <div>
              {reachedCount > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold">حفظ القرآن</span>
                    <span className="text-muted">
                      {quranDone} / {reachedCount} سورة (ممّا وصل إليه الفصل)
                    </span>
                  </div>
                  <Bar value={quranDone} max={reachedCount} />
                  {nextSurah ? (
                    <div className="text-xs text-brand mt-1.5">
                      📖 السورة القادمة للتسميع: <b>سورة {nextSurah.name}</b>
                    </div>
                  ) : (
                    <div className="text-xs text-brand mt-1.5">
                      👍 أكمل كل ما وصل إليه الفصل، أحسنت
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-muted">
                  لم يبدأ الفصل تسميع السور بعد.
                </div>
              )}
            </div>
          )}
          {s.homework && (
            <div>
              {curHw > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold">الواجبات</span>
                    <span className="text-muted">
                      {r.homeworkDone} / {curHw} (ممّا وصل إليه الفصل)
                    </span>
                  </div>
                  <Bar value={r.homeworkDone} max={curHw} />
                </>
              ) : (
                <div className="text-xs text-muted">
                  لم تبدأ واجبات الفصل بعد.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* القرآن */}
      {s.quran && (
        <Section
          title="القرآن الكريم"
          value={r.quran != null ? `${r.quran} / 20` : "—"}
        >
          <div className="space-y-1">
            {r.surahs.map((su, idx) => (
              <div
                key={su.num}
                className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-1.5 ${
                  idx > reachedIdx ? "bg-card/30 opacity-70" : "bg-card/60"
                }`}
              >
                <span className="font-medium">سورة {su.name}</span>
                {idx > reachedIdx ? (
                  <Badge kind="locked">🔒 لم نصل إليها بعد</Badge>
                ) : su.done ? (
                  <Badge kind="done">{su.grade}</Badge>
                ) : (
                  <Badge kind="pending">⏳ لم يُسمّع بعد</Badge>
                )}
              </div>
            ))}
            {r.recitation != null && (
              <div className="flex items-center justify-between gap-2 text-sm rounded-md bg-card/60 px-3 py-1.5">
                <span className="font-medium">تلاوة سورة المدثر</span>
                <span className="rounded-full bg-brand text-white text-xs px-2 py-0.5">
                  {r.recitation} / 4
                </span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* الاختبارات الشفهية والتحريرية */}
      {r.exams.length > 0 && (
        <Section title="الاختبارات الشفهية والتحريرية">
          <div className="space-y-1">
            {r.exams.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 text-sm rounded-md bg-card/60 px-3 py-1.5"
              >
                <span className="font-medium">{e.label}</span>
                {e.value != null ? (
                  <span className="rounded-full bg-brand text-white text-xs px-2 py-0.5">
                    {e.value} / 10
                  </span>
                ) : (
                  <span className="rounded-full bg-black/10 dark:bg-white/10 text-muted text-xs px-2 py-0.5">
                    لم يُرصد بعد
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* الواجبات (التقاويم) */}
      {s.homework && (
        <Section
          title="الواجبات (التقاويم)"
          value={`${r.homeworkDone} / ${r.homeworkCount}`}
        >
          <div className="space-y-1">
            {r.homeworkItems.map((h) => (
              <div
                key={h.num}
                className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-1.5 ${
                  h.num > curHw ? "bg-card/30 opacity-70" : "bg-card/60"
                }`}
              >
                <span className="font-medium">الواجب {h.num}</span>
                <span className="text-muted text-xs">
                  {h.page != null ? `التقويم ص ${h.page}` : "التقويم —"}
                </span>
                {h.num > curHw ? (
                  <Badge kind="locked">🔒 لم نصل إليه بعد</Badge>
                ) : h.done ? (
                  <Badge kind="done">✓ تم الحل</Badge>
                ) : (
                  <Badge kind="pending">⏳ لم يُرصد</Badge>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* المشاركة (اختياري) */}
      {s.participation && (
        <div className="rounded-lg bg-card p-2 text-center">
          <div className="text-lg font-bold text-brand">
            {r.participationGrade}
          </div>
          <div className="text-xs text-muted">المشاركة ({r.w.participation})</div>
        </div>
      )}

      {/* المجموع (اختياري) */}
      {s.total && (
        <div className="rounded-lg bg-brand text-white p-2 text-center">
          <div className="text-2xl font-bold">{r.total ?? "—"}</div>
          <div className="text-xs opacity-90">المجموع / 100</div>
        </div>
      )}

      {/* الملاحظات (اختياري) */}
      {s.notes && (
        <Section title="الملاحظات السلوكية">
          {r.notes.length === 0 ? (
            <div className="text-muted text-sm px-1">لا توجد ملاحظات.</div>
          ) : (
            <div className="space-y-1">
              {r.notes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-2 text-sm rounded-md bg-card/60 px-3 py-1.5"
                >
                  <span className="font-medium">{n.type}</span>
                  <span className="text-muted">{n.description}</span>
                  <span className="text-muted text-xs whitespace-nowrap">
                    {n.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Badge({
  kind,
  children,
}: {
  kind: "done" | "pending" | "locked";
  children: React.ReactNode;
}) {
  const cls =
    kind === "done"
      ? "bg-brand text-white"
      : kind === "pending"
      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
      : "bg-black/10 dark:bg-white/10 text-muted";
  return (
    <span
      className={`rounded-full text-xs px-2 py-0.5 whitespace-nowrap ${cls}`}
    >
      {children}
    </span>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// بطاقة قابلة للضغط: الضغط على العنوان يفتح التفاصيل
function Section({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-lg border border-brand/30 overflow-hidden">
      <summary className="flex items-center justify-between gap-2 cursor-pointer select-none px-3 py-3 font-bold bg-brandsoft/60 hover:bg-brandsoft active:bg-brandsoft">
        <span className="flex items-center gap-2">
          <span className="chev inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white text-xs leading-none">
            ▼
          </span>
          <span>{title}</span>
        </span>
        <span className="flex items-center gap-3">
          {value && <span className="text-brand">{value}</span>}
          <span className="hint text-[11px] text-muted font-normal rounded-full border border-brand/40 px-2 py-0.5">
            اضغط للتفاصيل
          </span>
        </span>
      </summary>
      <div className="p-2 pt-0 bg-card/40">{children}</div>
    </details>
  );
}
