// حالتان فقط: يقرأ / لا يقرأ (مع «غير محدد»). القيم: 0 غير محدد، 1 لا يقرأ، 3 يقرأ
// (القيمة 2 «متوسط» قديمة — تُعامَل كـ«يقرأ»)
export const READING_LEVELS = [
  { v: 0, label: "غير محدد" },
  { v: 3, label: "يقرأ" },
  { v: 1, label: "لا يقرأ" },
];

const MAP: Record<number, { label: string; dot: string }> = {
  1: { label: "لا يقرأ", dot: "🔴" },
  2: { label: "يقرأ", dot: "🟢" }, // قديمة (متوسط) → تُعرض كـ«يقرأ»
  3: { label: "يقرأ", dot: "🟢" },
};

// شارة مستوى القراءة — مخفية افتراضيًا عبر الصنف reading-badge
export default function ReadingBadge({ level }: { level: number }) {
  const m = MAP[level];
  if (!m) return null;
  return (
    <span
      className="reading-badge align-middle text-sm leading-none"
      title={`القراءة: ${m.label}`}
    >
      {m.dot}
    </span>
  );
}
