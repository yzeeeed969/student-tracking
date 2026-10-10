import type { Metadata } from "next";
import { Suspense } from "react";
import Toaster from "@/components/Toaster";
import AppFrame from "@/components/AppFrame";
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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}if(localStorage.getItem('showReading')==='1'){document.documentElement.classList.add('show-reading');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
