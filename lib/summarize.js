// Summaries of a paper's abstract.
// With ANTHROPIC_API_KEY set, Claude writes the summary.
// Without it, we pick the most informative sentences ourselves (no API needed).

const STOPWORDS = new Set(
  "a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves using used use based study paper results result show shows shown propose proposed approach method methods new two one however may also well within".split(
    " "
  )
);

function splitSentences(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9(“"])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

export function basicSummary(abstract) {
  const sentences = splitSentences(abstract);
  if (sentences.length <= 2) {
    return { mode: "basic", tldr: sentences[0] || abstract, keyPoints: sentences.slice(1) };
  }
  const freq = {};
  for (const word of abstract.toLowerCase().match(/[a-z][a-z-]{2,}/g) || []) {
    if (!STOPWORDS.has(word)) freq[word] = (freq[word] || 0) + 1;
  }
  const scored = sentences.map((s, index) => {
    const words = s.toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];
    const score = words.reduce((sum, w) => sum + (freq[w] || 0), 0) / Math.pow(words.length || 1, 0.4);
    // Findings often sit near the end of an abstract, so give later sentences a small boost.
    return { s, index, score: score * (1 + (index / sentences.length) * 0.25) };
  });
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
  const ordered = [...top].sort((a, b) => a.index - b.index).map((x) => x.s);
  return { mode: "basic", tldr: top[0].s, keyPoints: ordered.filter((s) => s !== top[0].s) };
}

async function aiSummary({ title, abstract }) {
  const prompt = `You are helping a university student understand a research paper from its abstract.

Title: ${title}
Abstract: ${abstract}

Reply with ONLY a JSON object (no markdown, no backticks) with these keys:
"tldr": one plain-English sentence (max 35 words) saying what the paper found,
"keyPoints": an array of 3 short bullet strings with the most important points,
"methods": one sentence on how the study was done (or "Not stated in the abstract"),
"limitations": one sentence on limitations or open questions a reader should keep in mind.
Only use information from the abstract.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Anthropic API answered ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("");
  const json = JSON.parse(text.replace(/```json|```/g, "").trim());
  return {
    mode: "ai",
    tldr: String(json.tldr || ""),
    keyPoints: Array.isArray(json.keyPoints) ? json.keyPoints.map(String).slice(0, 5) : [],
    methods: json.methods ? String(json.methods) : null,
    limitations: json.limitations ? String(json.limitations) : null,
  };
}

export async function summarizePaper({ title, abstract }) {
  const text = String(abstract || "").trim();
  if (text.length < 80) {
    const err = new Error("This paper has no abstract to summarize. Open the full text to read it.");
    err.status = 422;
    throw err;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await aiSummary({ title, abstract: text.slice(0, 6000) });
    } catch (err) {
      console.error("AI summary failed, using key sentences instead:", err.message);
    }
  }
  return basicSummary(text);
}
