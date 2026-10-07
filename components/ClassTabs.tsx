import Link from "next/link";

export default function ClassTabs({
  classes,
  active,
  base,
}: {
  classes: { id: number; name: string }[];
  active: number;
  base: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {classes.map((c) => (
        <Link
          key={c.id}
          href={`${base}?class=${c.id}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            c.id === active
              ? "bg-brand text-white"
              : "bg-brandsoft text-brand"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
