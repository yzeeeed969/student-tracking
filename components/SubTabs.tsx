import Link from "next/link";

// شريط تبويبات داخلية (مثل: الدرجات/الواجبات/القرآن/المشاركة داخل «الرصد»)
export default function SubTabs({
  tabs,
  active,
  base,
  classId,
}: {
  tabs: { view: string; label: string }[];
  active: string;
  base: string;
  classId?: number;
}) {
  return (
    <div className="flex gap-1 flex-wrap border-b border-[var(--border)] pb-2">
      {tabs.map((t) => {
        const href = `${base}?view=${t.view}${
          classId ? `&class=${classId}` : ""
        }`;
        const isActive = t.view === active;
        return (
          <Link
            key={t.view}
            href={href}
            prefetch={false}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold border-b-2 ${
              isActive
                ? "border-brand text-brand bg-brandsoft"
                : "border-transparent text-muted hover:text-brand"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
