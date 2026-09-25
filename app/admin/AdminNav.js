"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Star, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/featured", label: "Featured papers", icon: Star },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b border-line pb-2 lg:flex-col lg:border-b-0 lg:border-l lg:pb-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm lg:-ml-px lg:rounded-none lg:border-l-[3px] ${
              active ? "bg-ink/5 font-medium text-ink lg:border-mark lg:bg-transparent" : "text-soft hover:text-ink lg:border-transparent"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
