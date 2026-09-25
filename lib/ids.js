// Paper id helpers that are safe to use in both server and browser code.
// A paper id is either a lowercase DOI ("10.1038/nature14539") or an OpenAlex id ("W2100837269").

/** Encode an id for a URL path, keeping the slashes in DOIs. */
export function encodeIdPath(id) {
  return String(id).split("/").map(encodeURIComponent).join("/");
}

/** Link to our own paper page. */
export function paperHref(id) {
  return `/paper/${encodeIdPath(id)}`;
}

export function isOpenAlexId(id) {
  return /^w\d+$/i.test(String(id));
}

/** Turns the catch-all route segments back into an id. */
export function idFromSegments(segments = []) {
  const joined = (Array.isArray(segments) ? segments : [segments])
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .join("/");
  return isOpenAlexId(joined) ? joined.toUpperCase() : joined.toLowerCase();
}

/**
 * Accepts almost anything a person might paste (DOI, doi.org link, OpenAlex link or id,
 * a link to our own /paper/ page) and returns a paper id, or null.
 */
export function parsePaperInput(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  try {
    s = decodeURIComponent(s);
  } catch {}
  const own = s.match(/\/paper\/(.+)$/);
  if (own) s = own[1];
  const doi = s.match(/10\.\d{4,9}\/[^\s"]+/);
  if (doi) {
    let d = doi[0].replace(/[.,;]+$/, "");
    if (d.endsWith(">") && !d.includes("<")) d = d.slice(0, -1);
    // Drop a closing bracket only if it isn't part of the DOI, e.g. "(see 10.1/abc)".
    while (d.endsWith(")") && (d.match(/\(/g) || []).length < (d.match(/\)/g) || []).length) d = d.slice(0, -1);
    return d.toLowerCase();
  }
  const oa = s.match(/\b(W\d{4,})\b/i);
  if (oa) return oa[1].toUpperCase();
  return null;
}
