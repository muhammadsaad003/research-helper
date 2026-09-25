"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Menu, Settings, ShieldCheck, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import RoleBadge from "./RoleBadge";

function NavLink({ href, children, onClick }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-md px-3 py-2 text-sm transition-colors ${
        active ? "font-medium text-ink" : "text-soft hover:text-ink"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-3 -bottom-[13px] hidden h-[3px] rounded-full bg-mark md:block" />}
    </Link>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initial = (user.name || user.email || "?").trim()[0]?.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 text-sm hover:border-ink/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-on-primary">
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{user.name}</span>
        <ChevronDown size={14} className="text-soft" />
      </button>
      {open && (
        <div role="menu" className="panel absolute right-0 z-40 mt-2 w-60 p-1.5 shadow-lg">
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <p className="truncate text-xs text-soft">{user.email}</p>
          </div>
          {user.role === "ADMIN" && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-ink/5">
              <ShieldCheck size={16} /> Admin panel
            </Link>
          )}
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-ink/5">
            <Settings size={16} /> Account settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const user = session?.user;

  useEffect(() => setMobileOpen(false), [pathname]);

  const links = [
    { href: "/search", label: "Search" },
    { href: "/cite", label: "Citation maker" },
  ];
  if (user) {
    links.push({ href: "/dashboard", label: "Dashboard" }, { href: "/library", label: "Library" }, { href: "/compare", label: "Compare" });
  }
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: "Admin" });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        <nav className="ml-4 hidden items-center md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {status === "loading" ? (
            <span className="skeleton h-9 w-24" />
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
          <button
            type="button"
            className="btn-ghost h-9 w-9 p-0 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-line bg-canvas md:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-2">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
            {!user && (
              <div className="mt-2 flex gap-2 border-t border-line pt-3">
                <Link href="/login" className="btn-outline flex-1">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
