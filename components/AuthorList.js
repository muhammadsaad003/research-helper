"use client";

import { useState } from "react";

export default function AuthorList({ authors = [], limit = 12 }) {
  const [open, setOpen] = useState(false);
  if (!authors.length) return <p className="text-soft">Unknown authors</p>;
  const shown = open ? authors : authors.slice(0, limit);
  return (
    <p className="text-[0.95rem]">
      {shown.join(", ")}
      {authors.length > limit && (
        <>
          {!open && "…"}{" "}
          <button type="button" onClick={() => setOpen(!open)} className="text-sm text-soft underline underline-offset-2 hover:text-ink">
            {open ? "Show fewer" : `Show all ${authors.length} authors`}
          </button>
        </>
      )}
    </p>
  );
}
