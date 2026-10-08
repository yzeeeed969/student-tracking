import type { Metadata } from "next";
import { Suspense } from "react";
import Toaster from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام متابعة الطلاب",
  description: "متابعة طلاب الصف الثالث الابتدائي",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
