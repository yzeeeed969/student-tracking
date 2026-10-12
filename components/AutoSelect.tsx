"use client";

import { useTransition, useState } from "react";
import { fireToast } from "./useSelection";

// قائمة منسدلة تحفظ القيمة تلقائيًا بمجرد اختيارها (دون زر حفظ)
export default function AutoSelect({
  name,
  defaultValue = "",
  options,
  action,
  className,
}: {
  name: string;
  defaultValue?: string;
  options: { v: string; l: string }[];
  action: (value: string) => Promise<unknown>;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [val, setVal] = useState(defaultValue);

  return (
    <select
      name={name}
      value={val}
      className={className}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        setVal(v);
        start(async () => {
          try {
            await action(v);
            fireToast("تم الحفظ ✓");
          } catch {
            fireToast("تعذّر الحفظ، حاول مجددًا");
          }
        });
      }}
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}
