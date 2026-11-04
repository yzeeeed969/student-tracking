import { db } from "@/db";
import { worksheets, worksheetQuestions } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import ToastForm from "@/components/ToastForm";
import CopyLinkButton from "@/components/CopyLinkButton";
import { parseOptions } from "@/lib/worksheetQuestions";
import { addQuestion, saveQuestion, deleteQuestion, moveQuestion } from "../q-actions";

export const dynamic = "force-dynamic";

export default async function WorksheetQuestionsPage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const n = Number(num);
  const [ws] = await db.select().from(worksheets).where(eq(worksheets.num, n));

  if (!ws) {
    return (
      <div className="min-h-screen p-6">
        <div className="card p-6 text-center">
          <div className="font-bold mb-1">الدرس غير موجود</div>
          <Link href="/worksheets" className="text-brand underline">
            رجوع لأوراق العمل
          </Link>
        </div>
      </div>
    );
  }

  const questions = await db
    .select()
    .from(worksheetQuestions)
    .where(eq(worksheetQuestions.worksheetId, ws.id))
    .orderBy(asc(worksheetQuestions.order), asc(worksheetQuestions.id));

  const solvePath = `/solve/${ws.num}`;

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">
            أسئلة ورقة العمل — {ws.title}
          </h1>
          <Link href="/worksheets" className="text-brand underline text-sm">
            ← كل الأوراق
          </Link>
        </div>

        <div className="card p-4 space-y-2 text-sm">
          <div className="text-muted">
            أضِف أسئلة اختيار من متعدد. يحلّها الطالب عبر الرابط العام، وتُرصد
            درجته تلقائيًا من ١٠ (جبر الكسر للأعلى). درجاتك اليدوية الحالية لا
            تُمَس — لا يُرصد إلا إذا كانت الخانة فارغة.
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={solvePath}
              target="_blank"
              className="text-brand underline"
            >
              معاينة صفحة الحل
            </Link>
            <CopyLinkButton
              path={solvePath}
              className="text-xs bg-brand text-white rounded px-2 py-1 hover:opacity-90"
              label="📋 نسخ رابط الطلاب"
            />
            <span className="text-muted">
              عدد الأسئلة: {questions.length}
            </span>
          </div>
        </div>

        {questions.map((q, i) => {
          const opts = parseOptions(q.options);
          return (
            <div key={q.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand">سؤال {i + 1}</span>
                <div className="flex items-center gap-1">
                  <MoveBtn wsId={ws.id} qId={q.id} dir="up" disabled={i === 0} />
                  <MoveBtn
                    wsId={ws.id}
                    qId={q.id}
                    dir="down"
                    disabled={i === questions.length - 1}
                  />
                  <DeleteBtn wsId={ws.id} qId={q.id} />
                </div>
              </div>

              <ToastForm
                action={saveQuestion}
                toast="تم حفظ السؤال"
                className="space-y-3"
              >
                <input type="hidden" name="questionId" value={q.id} />
                <div>
                  <label className="text-sm text-muted block mb-1">
                    نص السؤال
                  </label>
                  <textarea
                    name="prompt"
                    defaultValue={q.prompt}
                    rows={2}
                    className="form-textarea w-full"
                    placeholder="اكتب السؤال هنا…"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    الخيارات (خيار واحد في كل سطر)
                  </label>
                  <textarea
                    name="options"
                    defaultValue={opts.join("\n")}
                    rows={Math.max(3, opts.length)}
                    className="form-textarea w-full"
                    placeholder={"الخيار الأول\nالخيار الثاني\nالخيار الثالث"}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm text-muted">
                    رقم الخيار الصحيح (من الأعلى، يبدأ بـ ١):
                  </label>
                  <input
                    type="number"
                    name="correct"
                    min={1}
                    max={6}
                    defaultValue={q.correctIndex + 1}
                    className="form-input w-20 text-center"
                  />
                  <button type="submit" className="btn">
                    حفظ السؤال
                  </button>
                </div>
              </ToastForm>
            </div>
          );
        })}

        <form action={addQuestion}>
          <input type="hidden" name="worksheetId" value={ws.id} />
          <button
            type="submit"
            className="w-full card p-4 text-brand font-bold hover:bg-brand/5 border-2 border-dashed border-brand/40"
          >
            ＋ إضافة سؤال جديد
          </button>
        </form>
      </main>
    </div>
  );
}

function MoveBtn({
  wsId,
  qId,
  dir,
  disabled,
}: {
  wsId: number;
  qId: number;
  dir: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveQuestion}>
      <input type="hidden" name="worksheetId" value={wsId} />
      <input type="hidden" name="questionId" value={qId} />
      <input type="hidden" name="dir" value={dir} />
      <button
        type="submit"
        disabled={disabled}
        className="text-sm px-2 py-0.5 rounded bg-muted/10 disabled:opacity-30"
        title={dir === "up" ? "أعلى" : "أسفل"}
      >
        {dir === "up" ? "▲" : "▼"}
      </button>
    </form>
  );
}

function DeleteBtn({ wsId, qId }: { wsId: number; qId: number }) {
  return (
    <form action={deleteQuestion}>
      <input type="hidden" name="worksheetId" value={wsId} />
      <input type="hidden" name="questionId" value={qId} />
      <button
        type="submit"
        className="text-sm px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
        title="حذف السؤال"
      >
        🗑
      </button>
    </form>
  );
}
