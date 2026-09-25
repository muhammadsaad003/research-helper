import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { one } from "@/lib/db";
import LibraryEditor from "./LibraryEditor";

export const metadata = { title: "Paper notes" };
export const dynamic = "force-dynamic";

export default async function LibraryItemPage({ params }) {
  const { id } = await params;
  const user = await requireUserPage(`/library/${id}`);
  if (!/^\d+$/.test(id)) notFound();
  const item = await one(
    `SELECT id, paper_id, title, authors, year, venue, doi, url, abstract, cited_by, meta, status, tags,
            notes, method, findings, gap, summary, created_at, updated_at
       FROM saved_papers WHERE id = $1 AND user_id = $2`,
    [Number(id), user.id]
  );
  if (!item) notFound();
  // Dates must be plain strings to pass into a client component.
  item.created_at = item.created_at.toISOString();
  item.updated_at = item.updated_at.toISOString();
  return <LibraryEditor item={item} />;
}
