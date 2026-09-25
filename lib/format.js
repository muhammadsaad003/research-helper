// Small display helpers shared by server and client components.

export function shortAuthors(authors = [], max = 4) {
  if (!authors.length) return "Unknown authors";
  if (authors.length <= max) return authors.join(", ");
  return `${authors.slice(0, max).join(", ")} and ${authors.length - max} more`;
}

export function formatNumber(n) {
  if (n === null || n === undefined) return "";
  return new Intl.NumberFormat("en").format(n);
}

/** plural(1, "paper") -> "1 paper", plural(3, "paper") -> "3 papers" */
export function plural(n, word, many = `${word}s`) {
  return `${formatNumber(n)} ${n === 1 ? word : many}`;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(value) {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${unit}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export const STATUS = {
  TO_READ: { label: "To read", dot: "bg-soft" },
  READING: { label: "Reading", dot: "bg-warn" },
  DONE: { label: "Done", dot: "bg-ok" },
};
