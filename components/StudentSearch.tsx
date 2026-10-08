"use client";
import { useState } from "react";

function norm(s: string) {
  return (s || "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

// حقل بحث يخفي صفوف الطلاب التي لا تطابق الاسم (يعتمد على data-name في كل صف)
export default function StudentSearch({
  placeholder = "ابحث باسم الطالب…",
}: {
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  function onChange(v: string) {
    setQ(v);
    const nq = norm(v);
    document.querySelectorAll<HTMLElement>("tr[data-name]").forEach((tr) => {
      const name = norm(tr.dataset.name || "");
      tr.style.display = !nq || name.includes(nq) ? "" : "none";
    });
  }
  return (
    <input
      type="search"
      value={q}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full md:w-72"
    />
  );
}
