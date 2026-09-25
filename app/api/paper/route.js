import { NextResponse } from "next/server";
import { getPaper, parsePaperInput } from "@/lib/papers";

// GET /api/paper?id=10.1038/nature14539  (also accepts doi.org or OpenAlex links)
export async function GET(req) {
  const raw = req.nextUrl.searchParams.get("id") || "";
  const id = parsePaperInput(raw);
  if (!id) return NextResponse.json({ error: "Enter a DOI (starts with 10.) or an OpenAlex id (starts with W)." }, { status: 400 });
  const paper = await getPaper(id);
  if (!paper) return NextResponse.json({ error: "No paper found for that DOI. Check it for typos." }, { status: 404 });
  return NextResponse.json({ paper });
}
