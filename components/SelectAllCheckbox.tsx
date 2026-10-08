"use client";

// خانة "تحديد الكل" — تحدّد كل الصفوف الظاهرة (تحترم فلتر البحث)
export default function SelectAllCheckbox() {
  return (
    <input
      type="checkbox"
      className="selectall"
      title="تحديد الكل"
      onChange={(e) => {
        const on = e.currentTarget.checked;
        const scope: ParentNode = e.currentTarget.closest("table") || document;
        scope
          .querySelectorAll<HTMLInputElement>(".rowchk")
          .forEach((c) => {
            const tr = c.closest("tr") as HTMLElement | null;
            if (tr && tr.style.display === "none") return;
            c.checked = on;
          });
        document.dispatchEvent(new Event("change"));
      }}
    />
  );
}
