import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { VERSION } from "@/lib/version";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/students", label: "الطلاب" },
  { href: "/grades", label: "الدرجات" },
  { href: "/homework", label: "الواجبات" },
  { href: "/participation", label: "المشاركة" },
  { href: "/behavior", label: "السلوك والملاحظات" },
  { href: "/reports", label: "التقارير" },
  { href: "/settings", label: "الإعدادات" },
];

export default function Nav() {
  return (
    <header className="card m-3 mb-0 px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="font-bold text-brand text-lg">متابعة الطلاب</span>
        <span className="text-muted text-xs">v{VERSION}</span>
      </div>
      <nav className="flex gap-1 flex-wrap flex-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 rounded-lg hover:bg-brandsoft text-sm"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link href="/showcase" className="btn-ghost btn text-sm" target="_blank">
          صفحة العرض
        </Link>
        <form action="/api/logout" method="post">
          <button className="text-sm text-muted hover:text-red-500 px-2">
            خروج
          </button>
        </form>
      </div>
    </header>
  );
}
