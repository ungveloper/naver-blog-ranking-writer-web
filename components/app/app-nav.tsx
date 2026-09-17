import Link from "next/link";

const items = [
  { href: "/", label: "대시보드" },
  { href: "/hospitals", label: "병원" },
  { href: "/projects", label: "콘텐츠 프로젝트" },
];

export function AppNav() {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md border px-3 py-2 transition-colors hover:bg-muted"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
