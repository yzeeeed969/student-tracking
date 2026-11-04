"use client";
import { useMemo, useState } from "react";

type Q = { id: number; prompt: string; options: string[] };
type ClassRoster = {
  classId: number;
  className: string;
  students: { id: number; name: string }[];
};

function deviceId(): string {
  try {
    let d = localStorage.getItem("st_device");
    if (!d) {
      d = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("st_device", d);
    }
    return d;
  } catch {
    return "";
  }
}

export default function SolveClient({
  num,
  title,
  questions,
  roster,
}: {
  num: number;
  title: string;
  questions: Q[];
  roster: ClassRoster[];
}) {
  const [cls, setCls] = useState<ClassRoster | null>(
    roster.length === 1 ? roster[0] : null
  );
  const [studentId, setStudentId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | null
    | { score: number; correct: number; total: number; graded: boolean }
  >(null);
  const [error, setError] = useState("");

  const studentName = useMemo(() => {
    for (const c of roster)
      for (const s of c.students) if (s.id === studentId) return s.name;
    return "";
  }, [roster, studentId]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  async function submit() {
    if (!studentId || !allAnswered || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/ws-submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          num,
          studentId,
          answers: questions.map((q) => ({
            id: q.id,
            choice: answers[q.id],
          })),
          device: deviceId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "cooldown")
          setError(`انتظر قليلًا (${data.wait || 5} ثانية) ثم أعد المحاولة.`);
        else if (data.error === "mismatch")
          setError("حدث خطأ في تحديد الطالب. أعد اختيار اسمك.");
        else setError("تعذّر الإرسال، حاول مجددًا.");
        setSubmitting(false);
        return;
      }
      setResult(data);
    } catch {
      setError("تعذّر الاتصال، تأكّد من الإنترنت وحاول مجددًا.");
    }
    setSubmitting(false);
  }

  // ———— شاشة النتيجة ————
  if (result) {
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    const great = pct >= 80;
    return (
      <div className="max-w-xl mx-auto p-4">
        <div className="card p-6 text-center space-y-3">
          <div className="text-5xl">{great ? "🎉" : "✅"}</div>
          <div className="text-xl font-bold">أحسنت يا {studentName}!</div>
          <div className="text-muted">ورقة عمل: {title}</div>
          <div className="text-4xl font-bold text-brand">
            {result.score} / 10
          </div>
          <div className="text-sm text-muted">
            أجبت بشكل صحيح على {result.correct} من {result.total}
          </div>
          {!result.graded && (
            <div className="text-xs text-muted bg-muted/10 rounded p-2">
              لديك درجة محفوظة مسبقًا لهذه الورقة، فلن تُستبدل. تظهر لك نتيجتك
              الآن فقط.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ———— اختيار الفصل ————
  if (!cls) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <Header title={title} />
        <div className="card p-4 space-y-3">
          <div className="font-bold">اختر فصلك</div>
          <div className="grid grid-cols-2 gap-2">
            {roster.map((c) => (
              <button
                key={c.classId}
                onClick={() => setCls(c)}
                className="btn"
              >
                {c.className}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ———— اختيار الاسم ————
  if (!studentId) {
    const list = cls.students.filter((s) =>
      s.name.includes(search.trim())
    );
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <Header title={title} />
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold">اختر اسمك ({cls.className})</div>
            {roster.length > 1 && (
              <button
                onClick={() => setCls(null)}
                className="text-brand text-sm underline"
              >
                تغيير الفصل
              </button>
            )}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسمك…"
            className="form-input w-full"
          />
          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-auto">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => setStudentId(s.id)}
                className="text-right px-3 py-2 rounded bg-muted/10 hover:bg-brand/10"
              >
                {s.name}
              </button>
            ))}
            {list.length === 0 && (
              <div className="text-muted text-sm text-center py-2">
                لا يوجد اسم مطابق
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ———— الأسئلة ————
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Header title={title} />
      <div className="card p-3 flex items-center justify-between text-sm">
        <span>
          الطالب: <b>{studentName}</b>
        </span>
        <button
          onClick={() => {
            setStudentId(null);
            setAnswers({});
          }}
          className="text-brand underline"
        >
          تغيير الاسم
        </button>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="card p-4 space-y-2">
          <div className="font-bold">
            {i + 1}. {q.prompt}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[q.id] === oi;
              return (
                <button
                  key={oi}
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [q.id]: oi }))
                  }
                  className={
                    "text-right px-3 py-2 rounded border transition " +
                    (chosen
                      ? "bg-brand text-white border-brand"
                      : "bg-muted/5 border-muted/20 hover:bg-brand/10")
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <div className="card p-3 text-red-600 text-sm text-center">{error}</div>
      )}

      <div className="sticky bottom-3">
        <button
          onClick={submit}
          disabled={!allAnswered || submitting}
          className="btn w-full text-lg py-3 disabled:opacity-50"
        >
          {submitting
            ? "جارٍ الإرسال…"
            : allAnswered
            ? "إرسال الإجابات"
            : `أجب عن كل الأسئلة (${answeredCount}/${questions.length})`}
        </button>
      </div>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="text-center pt-2">
      <div className="text-2xl mb-1">📝</div>
      <div className="text-lg font-bold">ورقة عمل: {title}</div>
    </div>
  );
}
