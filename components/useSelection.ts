import { useEffect, useState } from "react";

// يقرأ معرّفات الطلاب المحدّدين من خانات الاختيار ذات الصنف rowchk
export function useSelectedIds() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    const read = () =>
      setIds(
        [...document.querySelectorAll<HTMLInputElement>(".rowchk:checked")].map(
          (c) => Number(c.value)
        )
      );
    document.addEventListener("change", read);
    read();
    return () => document.removeEventListener("change", read);
  }, []);

  function clear() {
    document
      .querySelectorAll<HTMLInputElement>(".rowchk, .selectall")
      .forEach((c) => (c.checked = false));
    setIds([]);
  }

  return { ids, clear };
}

export function fireToast(msg: string) {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { msg } }));
}
