import { NextResponse } from "next/server";
import { searchPapers } from "@/lib/papers";

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") || "";
  if (!q.trim()) return NextResponse.json({ results: [], total: 0, page: 1 });

  try {
    const data = await searchPapers({
      q,
      page: Number(sp.get("page") || 1),
      from: sp.get("from"),
      to: sp.get("to"),
      oa: sp.get("oa") === "1",
      sort: sp.get("sort") || "relevance",
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (err) {
    console.error("Search failed:", err.message);
    return NextResponse.json(
      { error: "The paper databases didn't answer. Wait a moment and search again." },
      { status: 502 }
    );
  }
}
