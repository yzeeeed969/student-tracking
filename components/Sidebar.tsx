"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import ReadingToggle from "./ReadingToggle";
import { VERSION } from "@/lib/version";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/students", label: "الطلاب" },
  { href: "/grades", label: "الدرجات" },
  { href: "/homework", label: "الواجبات" },
  { href: "/quran", label: "القرآن" },
  { href: "/participation", label: "المشاركة" },
  { href: "/behavior", label: "السلوك والملاحظات" },
  { href: "/youtube", label: "المقاطع" },
  { href: "/books", label: "الكتب" },
  { href: "/reports", label: "التقارير" },
  { href: "/settings", label: "الإعدادات" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("has-sidebar");
    let c = false;
    try {
      const stored = localStorage.getItem("sidebarCollapsed");
      if (stored === "1") c = true;
      else if (stored === null && window.innerWidth < 768) c = true; // الجوال: مطويّة افتراضيًا
    } catch {}
    setCollapsed(c);
    el.classList.toggle("sidebar-collapsed", c);
    return () => {
      el.classList.remove("has-sidebar");
      el.classList.remove("sidebar-collapsed");
    };
  }, []);

  function toggle() {
    const c = !collapsed;
    setCollapsed(c);
    try {
      localStorage.setItem("sidebarCollapsed", c ? "1" : "0");
    } catch {}
    document.documentElement.classList.toggle("sidebar-collapsed", c);
  }

  return (
    <>
      <aside className="app-sidebar">
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
          <div className="flex flex-col">
            <span className="font-bold text-brand leading-tight">متابعة الطلاب</span>
            <span className="text-muted text-xs">v{VERSION}</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            title="إخفاء القائمة"
            className="text-muted hover:text-brand text-xl leading-none px-1"
          >
            »
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="px-3 py-2 rounded-lg hover:bg-brandsoft text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <ReadingToggle />
          </div>
          <Link
            href="/showcase"
            target="_blank"
            className="btn-ghost btn text-sm text-center"
          >
            صفحة العرض
          </Link>
          <form action="/api/logout" method="post">
            <button className="text-sm text-muted hover:text-red-500 w-full text-right px-2 py-1">
              خروج
            </button>
          </form>
        </div>
      </aside>

      {/* زر إظهار القائمة (يظهر عند الطيّ) */}
      <button
        type="button"
        onClick={toggle}
        className="sidebar-reveal"
        title="إظهار القائمة"
      >
        ☰
      </button>
    </>
  );
}
