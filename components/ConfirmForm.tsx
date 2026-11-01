"use client";

// نموذج يطلب تأكيدًا قبل تنفيذ إجراء حسّاس (حذف)
export default function ConfirmForm({
  action,
  confirm,
  className,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  confirm: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
