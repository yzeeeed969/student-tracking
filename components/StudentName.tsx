"use client";
import ReadingBadge from "./ReadingBadge";

// اسم الطالب كزرّ: النقر عليه يفتح نافذة إدخال درجاته (StudentGradeModal)
export default function StudentName({
  id,
  name,
  readingLevel = 0,
  className = "",
}: {
  id: number;
  name: string;
  readingLevel?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("open-student", { detail: { id } })
        )
      }
      title="اضغط لإدخال درجات الطالب"
      className={`text-right hover:text-brand hover:underline cursor-pointer ${className}`}
    >
      {name} <ReadingBadge level={readingLevel} />
    </button>
  );
}
