import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          {site.name}. Paper data from{" "}
          <a className="underline decoration-line underline-offset-2 hover:text-ink" href="https://openalex.org" target="_blank" rel="noreferrer">
            OpenAlex
          </a>{" "}
          and{" "}
          <a className="underline decoration-line underline-offset-2 hover:text-ink" href="https://www.crossref.org" target="_blank" rel="noreferrer">
            Crossref
          </a>
          .
        </p>
        <nav className="flex gap-4" aria-label="Footer">
          <Link href="/search" className="hover:text-ink">Search</Link>
          <Link href="/cite" className="hover:text-ink">Citation maker</Link>
          <Link href="/register" className="hover:text-ink">Create account</Link>
        </nav>
      </div>
    </footer>
  );
}
