"use client";
import { useActionState, useEffect, useRef } from "react";

// نموذج يرسل إجراء الخادم في مكانه (دون إعادة تحميل الصفحة) ثم يُظهر إشعارًا
export default function ToastForm({
  action,
  toast,
  className,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  toast: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(
    async (prev: number, fd: FormData) => {
      await action(fd);
      return prev + 1;
    },
    0
  );
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.dispatchEvent(
      new CustomEvent("app:toast", { detail: { msg: toast } })
    );
  }, [state, toast]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
