export const READING_LEVELS = [
  { v: 0, label: "غير محدد" },
  { v: 1, label: "لا يقرأ" },
  { v: 2, label: "متوسط" },
  { v: 3, label: "يقرأ جيدًا" },
];

const MAP: Record<number, { label: string; cls: string; dot: string }> = {
  1: { label: "لا يقرأ", cls: "bg-red-500/15 text-red-600", dot: "🔴" },
  2: { label: "متوسط", cls: "bg-amber-500/20 text-amber-600", dot: "🟡" },
  3: { label: "يقرأ جيدًا", cls: "bg-green-500/15 text-green-600", dot: "🟢" },
};

// شارة مستوى القراءة — مخفية افتراضيًا عبر الصنف reading-badge
export default function ReadingBadge({ level }: { level: number }) {
  const m = MAP[level];
  if (!m) return null;
  return (
    <span
      className={`reading-badge items-center gap-1 text-xs rounded-full px-2 py-0.5 align-middle ${m.cls}`}
      title={`مستوى القراءة: ${m.label}`}
    >
      <span>{m.dot}</span>
      <span>{m.label}</span>
    </span>
  );
}
