"use client";

import { useActionState, useState, useEffect } from "react";
import {
  lookupParent,
  type LookupState,
  type ParentReport,
  type ParentNotification,
} from "@/app/showcase/actions";
import RecorderModal from "@/components/RecorderModal";
import HomeworkUpload from "@/components/HomeworkUpload";
import { huthaifiAudio } from "@/lib/surahs";

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
    worksheets: true,
    total: false,
    notes: false,
  };

  const [openRecite, setOpenRecite] = useState<{
    num: number;
    name: string;
  } | null>(null);
  const [recitedLocal, setRecitedLocal] = useState<Record<number, boolean>>({});
  const [listenNum, setListenNum] = useState<number | null>(null);

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
        <div className="flex items-center gap-3">
          <div className="text-muted text-sm">{r.className}</div>
          <NotificationBell
            studentId={r.studentId}
            notifications={r.notifications}
          />
        </div>
      </div>

      {/* إلى أين وصل الفصل */}
      {(s.homework || s.quran) && (
        <div className="rounded-lg bg-brand text-white px-3 py-2 text-center space-y-0.5">
          <div className="text-sm font-bold">📍 وصل الفصل حتى:</div>
          {s.homework && (
            <div className="text-sm">
              الواجبات:{" "}
              <b>{curHw > 0 ? `الواجب ${curHw}` : "لم تبدأ بعد"}</b>
            </div>
          )}
          {s.quran && (
            <div className="text-sm">
              القرآن:{" "}
              <b>{reachedSurahName ? `سورة ${reachedSurahName}` : "لم يبدأ بعد"}</b>
            </div>
          )}
          <div className="text-[11px] opacity-90 mt-0.5">
            لا حاجة لحلّ أو تسميع ما بعد ذلك — فالفصل لم يصل إليه بعد.
          </div>
        </div>
      )}

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

      {/* البنود معروضة مباشرة كأعمدة — لا حاجة للضغط */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
      {/* القرآن */}
      {s.quran && (
        <Section
          title="القرآن الكريم"
          value={r.quran != null ? `${r.quran} / 20` : "—"}
        >
          <div className="space-y-1">
            {r.surahs.map((su, idx) => {
              const isNext = idx === reachedIdx + 1;
              const isLocked = idx > reachedIdx + 1;
              return (
                <div
                  key={su.num}
                  className={`text-sm rounded-md ${
                    isLocked
                      ? "bg-card/30 opacity-70"
                      : isNext && !su.done
                      ? "bg-brand/10 ring-1 ring-brand/40"
                      : "bg-card/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="font-medium">سورة {su.name}</span>
                    {isLocked ? (
                      <Badge kind="locked">🔒 لم نصل إليها بعد</Badge>
                    ) : su.done ? (
                      <Badge kind="done">{su.grade}</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        {su.recorded || recitedLocal[su.num] ? (
                          <Badge kind="pending">⏺ بانتظار المعلم</Badge>
                        ) : isNext ? (
                          <Badge kind="next">🎯 استعدّوا لها</Badge>
                        ) : (
                          <Badge kind="pending">⏳ لم يُسمّع بعد</Badge>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setListenNum((n) => (n === su.num ? null : su.num))
                          }
                          title="استماع لتلاوة الشيخ علي الحذيفي قبل التسميع (اختياري)"
                          className={`whitespace-nowrap rounded-lg text-xs px-2.5 py-1 border transition ${
                            listenNum === su.num
                              ? "bg-brand text-white border-brand"
                              : "bg-brand/10 text-brand border-brand/40 hover:bg-brand/20"
                          }`}
                        >
                          🔊 استماع
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRecite({ num: su.num, name: su.name })
                          }
                          className="whitespace-nowrap rounded-lg bg-emerald-600 text-white text-xs px-2.5 py-1 hover:opacity-90"
                        >
                          🎙 {su.recorded || recitedLocal[su.num] ? "إعادة" : "تسجيل"}
                        </button>
                      </div>
                    )}
                  </div>
                  {listenNum === su.num && !isLocked && !su.done && (
                    <div className="px-3 pb-2 pt-0.5 space-y-1">
                      <audio
                        src={huthaifiAudio(su.num)}
                        controls
                        autoPlay
                        preload="none"
                        className="w-full h-9"
                      />
                      <div className="text-[11px] text-muted">
                        تلاوة الشيخ علي الحذيفي (رواية حفص) — اختياري، للاستماع قبل
                        التسميع.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {openRecite && (
            <RecorderModal
              studentId={r.studentId}
              surah={openRecite}
              onClose={() => setOpenRecite(null)}
              onDone={() => {
                setRecitedLocal((m) => ({ ...m, [openRecite.num]: true }));
                setOpenRecite(null);
              }}
            />
          )}
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

      {/* أوراق العمل المطلوبة — تظهر فقط الأوراق التي لم يُجب عنها الطالب بعد */}
      {s.worksheets && r.worksheetItems.some((ws) => ws.score == null) && (
        <Section title="أوراق العمل المطلوبة">
          <div className="space-y-1">
            <div className="text-xs text-muted px-1 pb-1">
              هذه أوراق العمل التي لم يحلّها ابنك بعد — اضغط «حلّ الورقة».
            </div>
            {r.worksheetItems
              .filter((ws) => ws.score == null)
              .map((ws) => (
                <div
                  key={ws.num}
                  className="flex items-center justify-between gap-2 text-sm rounded-md bg-card/60 px-3 py-1.5 flex-wrap"
                >
                  <span className="font-medium flex-1 min-w-32">
                    ورقة عمل درس {ws.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {ws.url ? (
                      <a
                        href={ws.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs rounded-md bg-brand text-white px-3 py-1 hover:opacity-90"
                      >
                        📄 حلّ الورقة
                      </a>
                    ) : (
                      <Badge kind="pending">لا يوجد رابط</Badge>
                    )}
                  </div>
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
            {r.homeworkItems.map((h) => {
              const isNext = h.num === curHw + 1;
              const isLocked = h.num > curHw + 1;
              const canUpload = !isLocked && !h.done; // الواجبات المتاحة غير المرصودة
              return (
                <div
                  key={h.num}
                  className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-1.5 flex-wrap ${
                    isLocked
                      ? "bg-card/30 opacity-70"
                      : isNext && !h.done
                      ? "bg-brand/10 ring-1 ring-brand/40"
                      : "bg-card/60"
                  }`}
                >
                  <span className="font-medium">الواجب {h.num}</span>
                  <span className="text-muted text-xs">
                    {h.page != null ? `التقويم ص ${h.page}` : "التقويم —"}
                  </span>
                  <span className="flex items-center gap-2">
                    {isLocked ? (
                      <Badge kind="locked">🔒 لم نصل إليه بعد</Badge>
                    ) : h.done ? (
                      <Badge kind="done">✓ تم الحل</Badge>
                    ) : isNext ? (
                      <Badge kind="next">⭐ المطلوب القادم</Badge>
                    ) : (
                      <Badge kind="pending">⏳ لم يُرصد</Badge>
                    )}
                    {canUpload && (
                      <HomeworkUpload
                        studentId={r.studentId}
                        phone={r.phone}
                        num={h.num}
                        alreadyDone={false}
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
      </div>

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
  kind: "done" | "pending" | "locked" | "next";
  children: React.ReactNode;
}) {
  const cls =
    kind === "done"
      ? "bg-brand text-white"
      : kind === "next"
      ? "bg-brand/15 text-brand ring-1 ring-brand/50 font-bold"
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

// لوحة معروضة مباشرة — التفاصيل ظاهرة دائمًا بلا أي ضغط
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
    <div className="rounded-lg border border-brand/30 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 font-bold bg-brandsoft/60">
        <span>{title}</span>
        {value && <span className="text-brand">{value}</span>}
      </div>
      <div className="p-2 bg-card/40 flex-1">{children}</div>
    </div>
  );
}

// جرس الإشعارات لولي الأمر — يعرض إنجازات الطالب (واجب، تلاوة، مشاركة، ورقة عمل، اختبار)
function NotificationBell({
  studentId,
  notifications,
}: {
  studentId: number;
  notifications: ParentNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [shown, setShown] = useState<ParentNotification[]>([]);

  const storeKey = `ntf_seen_${studentId}`;

  function save(keys: string[]) {
    try {
      localStorage.setItem(storeKey, JSON.stringify(keys));
    } catch {
      // تجاهل: بعض المتصفحات تمنع التخزين
    }
  }

  // أول مرة: اعتبر كل الماضي مقروءًا (لا يظهر إلا الجديد لاحقًا)
  useEffect(() => {
    let stored: string[] | null = null;
    try {
      const raw = localStorage.getItem(storeKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) stored = parsed.map(String);
    } catch {
      stored = null;
    }
    if (stored === null) {
      // أول زيارة على هذا الجهاز: اكتم المتراكم السابق
      const allKeys = notifications.map((n) => n.key);
      setSeen(allKeys);
      save(allKeys);
    } else {
      setSeen(stored);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const seenSet = new Set(seen);
  const unreadList = ready
    ? notifications.filter((n) => !seenSet.has(n.key))
    : [];
  const unread = unreadList.length;

  function toggle() {
    const next = !open;
    if (next) {
      // اعرض الجديد ثم علّمه مقروءًا ليختفي بعد ذلك
      setShown(unreadList);
      const merged = Array.from(new Set([...seen, ...unreadList.map((n) => n.key)]));
      setSeen(merged);
      save(merged);
    }
    setOpen(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="الإشعارات"
        className="relative w-10 h-10 rounded-full bg-card border border-[var(--border)] flex items-center justify-center text-xl hover:bg-brandsoft/60"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 max-w-[85vw] max-h-96 overflow-auto rounded-xl bg-card border border-[var(--border)] shadow-xl z-50">
            <div className="sticky top-0 bg-brand text-white px-4 py-2 font-bold text-sm flex items-center justify-between">
              <span>🔔 إشعارات جديدة</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="opacity-90 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            {shown.length === 0 ? (
              <div className="p-5 text-center text-muted text-sm">
                لا توجد إشعارات جديدة. ستظهر هنا إنجازات ابنك الجديدة أولًا بأول.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {shown.map((n, i) => (
                  <li key={i} className="flex gap-2 px-3 py-2.5 items-start">
                    <span className="text-lg leading-none mt-0.5">{n.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm leading-snug">{n.message}</div>
                      {n.date && (
                        <div className="text-[11px] text-muted mt-0.5">{n.date}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
