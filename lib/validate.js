// Cleans up data coming from the browser before it goes into the database.
import { isOpenAlexId } from "./ids";

const str = (v, max) => (v === null || v === undefined ? null : String(v).trim().slice(0, max) || null);
const int = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Math.trunc(Number(v)) : null);
const httpUrl = (v) => {
  const s = str(v, 1000);
  return s && /^https?:\/\//i.test(s) ? s : null;
};

export function cleanPaper(p) {
  if (!p || typeof p !== "object") return null;
  const id = str(p.id, 300);
  if (!id || !(isOpenAlexId(id) || /^10\.\d{4,9}\//.test(id))) return null;
  const title = str(p.title, 1000);
  if (!title) return null;
  return {
    id: isOpenAlexId(id) ? id.toUpperCase() : id.toLowerCase(),
    title,
    authors: Array.isArray(p.authors) ? p.authors.slice(0, 100).map((a) => String(a).slice(0, 200)) : [],
    year: int(p.year),
    venue: str(p.venue, 500),
    doi: str(p.doi, 300),
    url: httpUrl(p.url),
    abstract: str(p.abstract, 12000),
    citedBy: int(p.citedBy),
    meta: {
      volume: str(p.volume, 50),
      issue: str(p.issue, 50),
      pages: str(p.pages, 50),
      type: str(p.type, 60),
      oaUrl: httpUrl(p.oaUrl),
    },
  };
}

export const STATUSES = ["TO_READ", "READING", "DONE"];

export function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  for (const t of tags) {
    const tag = String(t).trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= 12) break;
  }
  return out;
}
