"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// الصفحات العامة بلا قائمة جانبية
const BARE = ["/login", "/showcase"];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "/";
  const bare = BARE.some((b) => p === b || p.startsWith(b + "/"));
  if (bare) return <>{children}</>;
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
