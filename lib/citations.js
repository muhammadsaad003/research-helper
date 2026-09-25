// Citation formatting. Every formatter returns { text, html }:
// "text" is for plain copy/paste, "html" keeps italics (journal names, etc.).

export const STYLES = [
  { id: "apa", label: "APA 7" },
  { id: "mla", label: "MLA 9" },
  { id: "chicago", label: "Chicago" },
  { id: "harvard", label: "Harvard" },
  { id: "ieee", label: "IEEE" },
  { id: "bibtex", label: "BibTeX" },
];

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Jane A. Smith" or "Smith, Jane A." -> { first: "Jane A.", last: "Smith" } */
export function splitName(full) {
  const name = String(full || "").trim().replace(/\s+/g, " ");
  if (!name) return { first: "", last: "" };
  if (name.includes(",")) {
    const [last, ...rest] = name.split(",");
    return { first: rest.join(",").trim(), last: last.trim() };
  }
  const parts = name.split(" ");
  if (parts.length === 1) return { first: "", last: parts[0] };
  // Keep particles like "van der", "de", "da" with the last name.
  const particles = new Set(["van", "von", "der", "den", "de", "del", "della", "da", "di", "du", "la", "le", "bin", "al"]);
  let i = parts.length - 1;
  while (i > 1 && particles.has(parts[i - 1].toLowerCase())) i--;
  return { first: parts.slice(0, i).join(" "), last: parts.slice(i).join(" ") };
}

/** "Jane Ann" -> "J. A."  ("Jean-Paul" -> "J.-P.") */
function initials(first, { spaced = true } = {}) {
  const out = String(first || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((p) => (p.replace(/\./g, "")[0] || "").toUpperCase() + ".")
        .join("-")
    );
  return out.join(spaced ? " " : "");
}

function joinList(items, { and = "and", oxford = true, amp = false } = {}) {
  const word = amp ? "&" : and;
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]}${amp ? "," : ""} ${word} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}${oxford ? "," : ""} ${word} ${items[items.length - 1]}`;
}

const endDot = (s) => (/[.?!]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const doiUrl = (p) => (p.doi ? `https://doi.org/${p.doi}` : p.url || "");
const pagesDash = (pages) => String(pages || "").replace(/\s*[-–—]+\s*/g, "–");

function clean(p) {
  return {
    title: String(p.title || "Untitled").trim(),
    authors: (p.authors || []).filter(Boolean),
    year: p.year || null,
    venue: p.venue ? String(p.venue).trim() : "",
    volume: p.volume || "",
    issue: p.issue || "",
    pages: p.pages ? pagesDash(p.pages) : "",
    doi: p.doi || "",
    url: p.url || "",
    type: p.type || "",
  };
}

// ---------- APA 7 ----------
function apa(raw) {
  const p = clean(raw);
  const names = p.authors.map((a) => {
    const { first, last } = splitName(a);
    return first ? `${last}, ${initials(first)}` : last;
  });
  let authors = "";
  if (names.length > 20) authors = `${names.slice(0, 19).join(", ")}, . . . ${names[names.length - 1]}`;
  else if (names.length) authors = joinList(names, { amp: true });

  const year = `(${p.year || "n.d."}).`;
  const title = endDot(p.title);
  let src = "";
  let srcHtml = "";
  if (p.venue) {
    const vol = p.volume ? `, ${p.volume}` : "";
    const iss = p.issue ? `(${p.issue})` : "";
    const pg = p.pages ? `, ${p.pages}` : "";
    src = `${p.venue}${vol}${iss}${pg}.`;
    srcHtml = `<i>${esc(p.venue)}${p.volume ? `, ${esc(p.volume)}` : ""}</i>${esc(iss)}${esc(pg)}.`;
  }
  const link = doiUrl(p);
  const lead = authors ? `${endDot(authors)} ${year}` : `${title} ${year}`;
  const leadHtml = esc(lead);
  const middle = authors ? ` ${title}` : "";
  const text = [lead + middle, src, link].filter(Boolean).join(" ");
  const html = [leadHtml + esc(middle), srcHtml, esc(link)].filter(Boolean).join(" ");
  return { text, html };
}

// ---------- MLA 9 ----------
function mla(raw) {
  const p = clean(raw);
  const n = p.authors.map(splitName);
  let authors = "";
  if (n.length === 1) authors = n[0].first ? `${n[0].last}, ${n[0].first}` : n[0].last;
  else if (n.length === 2) authors = `${n[0].last}, ${n[0].first}, and ${[n[1].first, n[1].last].filter(Boolean).join(" ")}`;
  else if (n.length > 2) authors = `${n[0].last}, ${n[0].first}, et al`;

  const parts = [];
  if (p.volume) parts.push(`vol. ${p.volume}`);
  if (p.issue) parts.push(`no. ${p.issue}`);
  if (p.year) parts.push(String(p.year));
  if (p.pages) parts.push(`${p.pages.includes("–") ? "pp." : "p."} ${p.pages}`);
  const tail = parts.join(", ");
  const link = p.doi ? `https://doi.org/${p.doi}` : p.url;

  const a = authors ? `${endDot(authors)} ` : "";
  const t = `“${endDot(p.title)}” `;
  const text = `${a}${t}${p.venue ? `${p.venue}${tail ? ", " : ""}` : ""}${tail}${p.venue || tail ? "." : ""}${link ? ` ${link}.` : ""}`.trim();
  const html = `${esc(a)}${esc(t)}${p.venue ? `<i>${esc(p.venue)}</i>${tail ? ", " : ""}` : ""}${esc(tail)}${p.venue || tail ? "." : ""}${link ? ` ${esc(link)}.` : ""}`.trim();
  return { text, html };
}

// ---------- Chicago (author-date) ----------
function chicago(raw) {
  const p = clean(raw);
  const n = p.authors.map(splitName);
  const list = n.length > 10 ? n.slice(0, 7) : n;
  const formatted = list.map((a, i) => (i === 0 ? (a.first ? `${a.last}, ${a.first}` : a.last) : [a.first, a.last].filter(Boolean).join(" ")));
  let authors = joinList(formatted);
  if (n.length > 10) authors = `${formatted.join(", ")}, et al`;

  const year = p.year || "n.d.";
  const volIss = `${p.volume ? ` ${p.volume}` : ""}${p.issue ? ` (${p.issue})` : ""}`;
  const pg = p.pages ? `: ${p.pages}` : "";
  const link = doiUrl(p);
  const a = authors ? `${endDot(authors)} ` : "";
  const text = `${a}${year}. “${endDot(p.title)}”${p.venue ? ` ${p.venue}${volIss}${pg}.` : ""}${link ? ` ${link}.` : ""}`;
  const html = `${esc(a)}${esc(year)}. “${esc(endDot(p.title))}”${p.venue ? ` <i>${esc(p.venue)}</i>${esc(volIss)}${esc(pg)}.` : ""}${link ? ` ${esc(link)}.` : ""}`;
  return { text, html };
}

// ---------- Harvard ----------
function harvard(raw) {
  const p = clean(raw);
  const names = p.authors.map((a) => {
    const { first, last } = splitName(a);
    return first ? `${last}, ${initials(first, { spaced: false })}` : last;
  });
  let authors = "";
  if (names.length > 3) authors = `${names[0]} et al.`;
  else authors = joinList(names, { oxford: false });

  const year = `(${p.year || "n.d."})`;
  const vol = p.volume ? `, ${p.volume}` : "";
  const iss = p.issue ? `(${p.issue})` : "";
  const pg = p.pages ? `, pp. ${p.pages}` : "";
  const link = p.doi ? `doi:${p.doi}` : p.url ? `Available at: ${p.url}` : "";
  const a = authors ? `${authors} ` : "";
  const text = `${a}${year} ‘${p.title}’${p.venue ? `, ${p.venue}${vol}${iss}${pg}` : ""}.${link ? ` ${link}.` : ""}`;
  const html = `${esc(a)}${esc(year)} ‘${esc(p.title)}’${p.venue ? `, <i>${esc(p.venue)}</i>${esc(vol)}${esc(iss)}${esc(pg)}` : ""}.${link ? ` ${esc(link)}.` : ""}`;
  return { text, html };
}

// ---------- IEEE ----------
function ieee(raw, number) {
  const p = clean(raw);
  const names = p.authors.map((a) => {
    const { first, last } = splitName(a);
    return first ? `${initials(first)} ${last}` : last;
  });
  let authors = "";
  if (names.length > 6) authors = `${names[0]} et al.`;
  else authors = joinList(names, { oxford: true });

  const parts = [];
  if (p.volume) parts.push(`vol. ${p.volume}`);
  if (p.issue) parts.push(`no. ${p.issue}`);
  if (p.pages) parts.push(`${p.pages.includes("–") ? "pp." : "p."} ${p.pages}`);
  if (p.year) parts.push(String(p.year));
  const tail = parts.length ? `, ${parts.join(", ")}` : "";
  const doi = p.doi ? `, doi: ${p.doi}` : "";
  const num = number ? `[${number}] ` : "";
  const a = authors ? `${authors}, ` : "";
  const text = `${num}${a}“${p.title},”${p.venue ? ` ${p.venue}` : ""}${tail}${doi}.`;
  const html = `${esc(num)}${esc(a)}“${esc(p.title)},”${p.venue ? ` <i>${esc(p.venue)}</i>` : ""}${esc(tail)}${esc(doi)}.`;
  return { text, html };
}

// ---------- BibTeX ----------
function bibKey(p) {
  const first = p.authors[0] ? splitName(p.authors[0]).last : "anon";
  const word =
    p.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .find((w) => w.length > 3 && !["with", "from", "that", "this", "their", "using", "into"].includes(w)) || "paper";
  const base = `${first}${p.year || ""}${word}`;
  return base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function bibtex(raw) {
  const p = clean(raw);
  const isArticle = p.venue && (!p.type || /article|journal/i.test(p.type));
  const isProc = /proceedings|conference/i.test(p.type);
  const kind = isArticle ? "article" : isProc ? "inproceedings" : "misc";
  const field = (k, v) => (v ? `  ${k} = {${String(v).replace(/[{}]/g, "")}},` : null);
  const lines = [
    `@${kind}{${bibKey(p)},`,
    field("title", p.title),
    field("author", p.authors.map((a) => { const { first, last } = splitName(a); return first ? `${last}, ${first}` : last; }).join(" and ")),
    field(kind === "article" ? "journal" : kind === "inproceedings" ? "booktitle" : "howpublished", p.venue),
    field("year", p.year),
    field("volume", p.volume),
    field("number", p.issue),
    field("pages", p.pages.replace(/–/g, "--")),
    field("doi", p.doi),
    !p.doi ? field("url", p.url) : null,
  ].filter(Boolean);
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
  lines.push("}");
  const text = lines.join("\n");
  return { text, html: esc(text) };
}

const FORMATTERS = { apa, mla, chicago, harvard, ieee, bibtex };

export function formatCitation(paper, style = "apa", number) {
  const fn = FORMATTERS[style] || apa;
  return fn(paper, number);
}

/** A whole reference list. APA/MLA/Chicago/Harvard are sorted A–Z; IEEE is numbered. */
export function formatBibliography(papers, style = "apa") {
  if (style === "ieee") {
    const items = papers.map((p, i) => formatCitation(p, "ieee", i + 1));
    return { text: items.map((c) => c.text).join("\n"), html: items.map((c) => `<p>${c.html}</p>`).join("") };
  }
  const items = papers.map((p) => formatCitation(p, style));
  if (style !== "bibtex") items.sort((a, b) => a.text.localeCompare(b.text));
  const sep = style === "bibtex" ? "\n\n" : "\n";
  return {
    text: items.map((c) => c.text).join(sep),
    html: style === "bibtex" ? items.map((c) => c.html).join("\n\n") : items.map((c) => `<p>${c.html}</p>`).join(""),
  };
}
