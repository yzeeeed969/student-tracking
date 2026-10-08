"use client";
import { useRef, useTransition } from "react";

// زر يحفظ بيانات النموذج المحيط به في مكانه (دون إعادة تحميل الصفحة) ثم يُظهر إشعارًا
export default function RowSaveButton({
  action,
  toast,
  className,
  children,
  title,
}: {
  action: (fd: FormData) => Promise<void>;
  toast: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      ref={ref}
      title={title}
      disabled={pending}
      className={className}
      onClick={() => {
        const form = ref.current?.closest("form");
        const fd = form ? new FormData(form) : new FormData();
        startTransition(async () => {
          await action(fd);
          window.dispatchEvent(
            new CustomEvent("app:toast", { detail: { msg: toast } })
          );
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
