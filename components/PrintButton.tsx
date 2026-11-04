"use client";

export default function PrintButton({ label = "🖨 طباعة / حفظ PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn text-sm no-print">
      {label}
    </button>
  );
}
