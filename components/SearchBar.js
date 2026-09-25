"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ initial = "", size = "compact", autoFocus = false, extraParams = "" }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  useEffect(() => setQ(initial), [initial]);

  function submit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}${extraParams}`);
  }

  const big = size === "hero";
  return (
    <form onSubmit={submit} role="search" className="relative flex w-full items-center">
      <label htmlFor={big ? "hero-search" : "search"} className="sr-only">
        Search research papers
      </label>
      <Search className={`pointer-events-none absolute left-3 text-soft ${big ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden="true" />
      <input
        id={big ? "hero-search" : "search"}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder={big ? "Topic, title, author or DOI" : "Search by topic, title, author or DOI"}
        className={`field ${big ? "h-14 pl-11 pr-32 text-base" : "h-11 pl-9 pr-24"}`}
        autoComplete="off"
        enterKeyHint="search"
      />
      <button type="submit" className={`btn-primary absolute right-1.5 ${big ? "h-11 px-5" : "h-8 px-3"}`}>
        Search
      </button>
    </form>
  );
}
