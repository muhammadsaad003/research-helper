import { many } from "@/lib/db";
import FeaturedManager from "./FeaturedManager";

export const metadata = { title: "Featured papers" };

export default async function AdminFeaturedPage() {
  const rows = await many("SELECT id, paper_id, title, authors, year, venue, note, created_at FROM featured_papers ORDER BY created_at DESC");
  const items = rows.map((r) => ({ ...r, created_at: r.created_at.toISOString() }));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Featured papers</h1>
      <p className="mt-1 max-w-prose text-soft">
        These appear on the home page under “Picked by the editors”. The newest six are shown. You can also feature a paper from its details page.
      </p>
      <FeaturedManager initialItems={items} />
    </div>
  );
}
