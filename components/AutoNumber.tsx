"use client";
import { useState, useTransition } from "react";
import { fireToast } from "./useSelection";

// خانة رقمية تحفظ القيمة تلقائيًا عند الخروج منها (blur) — للرصد السريع
export default function AutoNumber({
  defaultValue = "",
  action,
  min = 0,
  max = 20,
  step = 1,
  className,
}: {
  defaultValue?: string;
  action: (value: string) => Promise<unknown>;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const [val, setVal] = useState(defaultValue);
  const [saved, setSaved] = useState(defaultValue);
  const [pending, start] = useTransition();

  function commit() {
    const v = val.trim();
    if (v === saved) return; // لا تغيير
    start(async () => {
      try {
        await action(v);
        setSaved(v);
        fireToast("تم الحفظ ✓");
      } catch {
        fireToast("تعذّر الحفظ، حاول مجددًا");
      }
    });
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      value={val}
      disabled={pending}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={className}
    />
  );
}
