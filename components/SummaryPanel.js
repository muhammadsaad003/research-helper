"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

export default function SummaryPanel({ paperId, savedId, hasAbstract = true, initialSummary = null }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, savedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't make a summary.");
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!hasAbstract) {
    return <p className="text-sm text-soft">This paper has no abstract in the database, so there is nothing to summarize yet.</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-sm text-soft">
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className="font-medium text-ink underline underline-offset-2">
          Log in
        </Link>{" "}
        to get a short summary of this paper.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-9/12" />
        <div className="skeleton h-4 w-10/12" />
        <span className="sr-only">Writing summary…</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <button type="button" onClick={run} className="btn-outline btn-sm">
          <Sparkles size={14} /> Summarize abstract
        </button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <p className="mb-2 text-xs text-soft">
        {summary.mode === "ai" ? "Written by AI from the abstract. Check it against the paper." : "Key sentences picked from the abstract."}
      </p>
      <p className="font-serif leading-relaxed">{summary.tldr}</p>
      {summary.keyPoints?.length > 0 && (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          {summary.keyPoints.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      )}
      {summary.methods && (
        <p className="mt-3 text-sm">
          <span className="font-medium">How it was done: </span>
          {summary.methods}
        </p>
      )}
      {summary.limitations && (
        <p className="mt-1.5 text-sm">
          <span className="font-medium">Keep in mind: </span>
          {summary.limitations}
        </p>
      )}
      <button type="button" onClick={run} className="btn-ghost btn-sm mt-3 -ml-3 text-soft">
        Summarize again
      </button>
    </div>
  );
}
