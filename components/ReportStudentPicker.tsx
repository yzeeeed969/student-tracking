"use client";
import { useRouter } from "next/navigation";

// منتقي الطالب في التقارير — يعرض تقرير الطالب فورًا عند تغيير الاختيار
// (بما في ذلك أسهم لوحة المفاتيح أعلى/أسفل)، ويبقى مركّزًا ليسهل التنقّل المتتابع
export default function ReportStudentPicker({
  students,
  current,
}: {
  students: { id: number; name: string; className: string | null }[];
  current: number;
}) {
  const router = useRouter();
  return (
    <select
      autoFocus
      defaultValue={current}
      onChange={(e) =>
        router.push(`/reports?student=${e.target.value}`, { scroll: false })
      }
      className="min-w-64"
      title="اختر الطالب (استخدم سهمي أعلى/أسفل للتنقّل)"
    >
      {students.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} ({a.className})
        </option>
      ))}
    </select>
  );
}
