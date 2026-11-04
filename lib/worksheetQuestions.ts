// أدوات مساعدة لأسئلة أوراق العمل التفاعلية

export type WSQuestion = {
  id: number;
  worksheetId: number;
  order: number;
  prompt: string;
  options: string[];
  correctIndex: number;
};

// تحويل حقل options (JSON نصّي) إلى مصفوفة نصوص آمنة
export function parseOptions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map((x) => String(x));
    return [];
  } catch {
    return [];
  }
}

// حساب الدرجة من 10 مع جبر الكسر للأعلى (كما يفضّل المعلم)
export function scoreFromCorrect(correct: number, total: number): number {
  if (!total || total <= 0) return 0;
  const raw = (correct / total) * 10;
  return Math.min(10, Math.ceil(raw - 1e-9));
}
