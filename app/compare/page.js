import { requireUserPage } from "@/lib/auth";
import { many } from "@/lib/db";
import CompareClient from "./CompareClient";

export const metadata = { title: "Compare papers" };
export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const user = await requireUserPage("/compare");
  const rows = await many(
    `SELECT id, paper_id, title, authors, year, venue, doi, cited_by, status, tags, method, findings, gap
       FROM saved_papers WHERE user_id = $1 ORDER BY year DESC NULLS LAST, title`,
    [user.id]
  );
  return <CompareClient items={rows} />;
}
