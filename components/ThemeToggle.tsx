"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }
  return (
    <button
      onClick={toggle}
      className="btn-ghost btn text-sm"
      title="تبديل الوضع الليلي"
      type="button"
    >
      {dark ? "☀️ نهاري" : "🌙 ليلي"}
    </button>
  );
}
