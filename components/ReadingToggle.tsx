"use client";
import { useEffect, useState } from "react";

// زر إظهار/إخفاء شارات مستوى القراءة (مخفية افتراضيًا — مناسب للعرض على البروجكتر)
export default function ReadingToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("showReading") === "1");
    } catch {}
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem("showReading", next ? "1" : "0");
    } catch {}
    document.documentElement.classList.toggle("show-reading", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost btn text-xs"
      title="إظهار/إخفاء مستوى القراءة"
    >
      {on ? "🙈 إخفاء القراءة" : "👁 مستوى القراءة"}
    </button>
  );
}
