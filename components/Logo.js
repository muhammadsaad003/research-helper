import Link from "next/link";
import { site } from "@/lib/site";

export default function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="12" fill="#1c2541" />
        <path d="M20 14h24v38l-12-8-12 8z" fill="rgb(var(--mark))" />
        <path d="M26 24h12M26 30h12" stroke="rgb(28 37 65)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-lg font-semibold tracking-tight">{site.name}</span>
    </Link>
  );
}
