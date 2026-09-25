import { encodeIdPath, isOpenAlexId } from "./ids";

// Talks to the free scholarly databases and turns their answers into one simple shape:
// { id, doi, openalexId, title, authors[], year, venue, abstract, citedBy,
//   isOa, oaUrl, url, volume, issue, pages, type, topics[], source }
//
// Search uses OpenAlex when OPENALEX_API_KEY is set (best results, has abstracts
// and open-access info). Otherwise it uses Crossref, which needs no key.

const OPENALEX = "https://api.openalex.org";
const CROSSREF = "https://api.crossref.org";
const CONTACT = process.env.CONTACT_EMAIL || "research-helper@example.com";
const USER_AGENT = `ResearchHelper/1.0 (mailto:${CONTACT})`;

const OA_SELECT = [
  "id", "doi", "display_name", "publication_year", "authorships", "primary_location",
  "cited_by_count", "open_access", "abstract_inverted_index", "biblio", "type", "topics",
].join(",");

const CR_SELECT = [
  "DOI", "title", "author", "container-title", "issued", "published-print", "published-online",
  "is-referenced-by-count", "abstract", "volume", "issue", "page", "type", "publisher",
].join(",");

class SourceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchJson(url, { revalidate = 3600 } = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate },
  });
  if (!res.ok) throw new SourceError(`${new URL(url).hostname} answered ${res.status}`, res.status);
  return res.json();
}

function openAlexParams(extra = {}) {
  const p = new URLSearchParams(extra);
  if (process.env.OPENALEX_API_KEY) p.set("api_key", process.env.OPENALEX_API_KEY);
  else p.set("mailto", CONTACT);
  return p;
}

export { encodeIdPath, paperHref, isOpenAlexId, parsePaperInput } from "./ids";

// ---------- OpenAlex ----------

function invertAbstract(inv) {
  if (!inv || typeof inv !== "object") return null;
  const words = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.filter((w) => w !== undefined).join(" ").trim();
  return text || null;
}

export function fromOpenAlex(w) {
  const doi = w.doi ? w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : null;
  const openalexId = w.id ? String(w.id).split("/").pop() : null;
  const loc = w.primary_location || {};
  const b = w.biblio || {};
  let pages = null;
  if (b.first_page) pages = b.last_page && b.last_page !== b.first_page ? `${b.first_page}-${b.last_page}` : b.first_page;
  return {
    id: doi ? doi.toLowerCase() : openalexId,
    doi,
    openalexId,
    title: stripTags(w.display_name || w.title) || "Untitled",
    authors: (w.authorships || []).map((a) => a?.author?.display_name).filter(Boolean),
    year: w.publication_year || null,
    venue: loc.source?.display_name || null,
    abstract: invertAbstract(w.abstract_inverted_index),
    citedBy: typeof w.cited_by_count === "number" ? w.cited_by_count : null,
    isOa: Boolean(w.open_access?.is_oa),
    oaUrl: w.open_access?.oa_url || null,
    url: doi ? `https://doi.org/${doi}` : loc.landing_page_url || w.id || null,
    volume: b.volume || null,
    issue: b.issue || null,
    pages,
    type: w.type || null,
    topics: (w.topics || []).slice(0, 4).map((t) => t.display_name).filter(Boolean),
    source: "openalex",
  };
}

async function searchOpenAlex({ q, page, perPage, from, to, oa, sort }) {
  const params = openAlexParams({ search: q, per_page: String(perPage), page: String(page), select: OA_SELECT });
  const filters = [];
  if (from) filters.push(`from_publication_date:${from}-01-01`);
  if (to) filters.push(`to_publication_date:${to}-12-31`);
  if (oa) filters.push("open_access.is_oa:true");
  if (filters.length) params.set("filter", filters.join(","));
  if (sort === "citations") params.set("sort", "cited_by_count:desc");
  if (sort === "newest") params.set("sort", "publication_date:desc");

  const data = await fetchJson(`${OPENALEX}/works?${params}`);
  return {
    results: (data.results || []).map(fromOpenAlex),
    total: data.meta?.count ?? 0,
    source: "openalex",
  };
}

// ---------- Crossref ----------

function stripTags(s) {
  if (!s) return "";
  return String(s)
    .replace(/<jats:title>\s*abstract\s*<\/jats:title>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function fromCrossref(m) {
  const doi = m.DOI;
  const dateParts =
    (m.issued || m["published-print"] || m["published-online"] || m.published || {})["date-parts"] || [];
  const year = dateParts[0] && dateParts[0][0] ? Number(dateParts[0][0]) : null;
  const authors = (m.author || [])
    .map((a) => a.name || [a.given, a.family].filter(Boolean).join(" "))
    .filter(Boolean);
  const abstract = m.abstract ? stripTags(m.abstract) : null;
  return {
    id: String(doi).toLowerCase(),
    doi,
    openalexId: null,
    title: stripTags((m.title || [])[0]) || "Untitled",
    authors,
    year,
    venue: (m["container-title"] || [])[0] || m.publisher || null,
    abstract: abstract || null,
    citedBy: typeof m["is-referenced-by-count"] === "number" ? m["is-referenced-by-count"] : null,
    isOa: false,
    oaUrl: null,
    url: `https://doi.org/${doi}`,
    volume: m.volume || null,
    issue: m.issue || null,
    pages: m.page || null,
    type: m.type || null,
    topics: (m.subject || []).slice(0, 4),
    source: "crossref",
  };
}

async function searchCrossref({ q, page, perPage, from, to, sort }) {
  const params = new URLSearchParams({
    "query.bibliographic": q,
    rows: String(perPage),
    offset: String((page - 1) * perPage),
    mailto: CONTACT,
  });
  const filters = [];
  if (from) filters.push(`from-pub-date:${from}`);
  if (to) filters.push(`until-pub-date:${to}`);
  if (filters.length) params.set("filter", filters.join(","));
  if (sort === "citations") {
    params.set("sort", "is-referenced-by-count");
    params.set("order", "desc");
  }
  if (sort === "newest") {
    params.set("sort", "published");
    params.set("order", "desc");
  }

  let data;
  try {
    data = await fetchJson(`${CROSSREF}/works?${params}&select=${CR_SELECT}`);
  } catch (err) {
    // If Crossref ever rejects a field name, retry without the field list.
    if (err.status === 400) data = await fetchJson(`${CROSSREF}/works?${params}`);
    else throw err;
  }
  const items = (data.message?.items || []).filter((m) => m.DOI);
  return {
    results: items.map(fromCrossref),
    total: data.message?.["total-results"] ?? 0,
    source: "crossref",
  };
}

// ---------- Public functions ----------

const MAX_RESULTS = 10_000; // both APIs stop paging around here

export async function searchPapers({ q, page = 1, perPage = 10, from, to, oa = false, sort = "relevance" }) {
  const query = String(q || "").trim().slice(0, 300);
  if (!query) return { results: [], total: 0, page: 1, perPage, source: null };

  const safePage = Math.max(1, Math.min(Number(page) || 1, Math.floor(MAX_RESULTS / perPage)));
  const yearFrom = /^\d{4}$/.test(String(from || "")) ? String(from) : null;
  const yearTo = /^\d{4}$/.test(String(to || "")) ? String(to) : null;
  const args = { q: query, page: safePage, perPage, from: yearFrom, to: yearTo, oa, sort };

  let result;
  let notice = null;
  if (process.env.OPENALEX_API_KEY) {
    try {
      result = await searchOpenAlex(args);
    } catch (err) {
      console.error("OpenAlex search failed, using Crossref:", err.message);
      result = await searchCrossref(args);
      notice = "OpenAlex is not responding right now, so these results come from Crossref.";
    }
  } else {
    result = await searchCrossref(args);
    if (oa) notice = "The open-access filter needs an OpenAlex key, so it was ignored.";
  }
  return { ...result, page: safePage, perPage, total: Math.min(result.total, MAX_RESULTS), notice };
}

/** Look up one paper by DOI or OpenAlex id. Returns null if it can't be found. */
export async function getPaper(id) {
  const clean = String(id || "").trim();
  if (!clean) return null;

  if (isOpenAlexId(clean)) {
    try {
      const w = await fetchJson(`${OPENALEX}/works/${clean.toUpperCase()}?${openAlexParams()}`, { revalidate: 86400 });
      return fromOpenAlex(w);
    } catch {
      return null;
    }
  }

  // Treat everything else as a DOI. Single look-ups on OpenAlex are free, even without a key.
  try {
    const w = await fetchJson(`${OPENALEX}/works/doi:${encodeIdPath(clean)}?${openAlexParams()}`, { revalidate: 86400 });
    return fromOpenAlex(w);
  } catch {}
  try {
    const data = await fetchJson(`${CROSSREF}/works/${encodeIdPath(clean)}?mailto=${encodeURIComponent(CONTACT)}`, {
      revalidate: 86400,
    });
    return data.message?.DOI ? fromCrossref(data.message) : null;
  } catch {
    return null;
  }
}

/** Shape a saved/featured database row back into a paper object. */
export function paperFromRow(row) {
  const meta = row.meta || {};
  return {
    id: row.paper_id,
    doi: row.doi || null,
    title: row.title,
    authors: row.authors || [],
    year: row.year,
    venue: row.venue,
    abstract: row.abstract,
    citedBy: row.cited_by,
    url: row.url,
    volume: meta.volume || null,
    issue: meta.issue || null,
    pages: meta.pages || null,
    type: meta.type || null,
    oaUrl: meta.oaUrl || null,
    isOa: Boolean(meta.oaUrl),
  };
}
