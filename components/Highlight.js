// Wraps the words from the search query in <mark> (the highlighter look).
const SKIP = new Set(["the", "and", "for", "with", "from", "into", "that", "this", "are", "was", "how"]);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Highlight({ text = "", query = "" }) {
  const terms = String(query)
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((t) => t.length > 2 && !SKIP.has(t));
  if (!text || !terms.length) return text;

  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "giu");
  const parts = String(text).split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
}
