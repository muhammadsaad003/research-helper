import { many } from "@/lib/db";
import AnnouncementsManager from "./AnnouncementsManager";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const rows = await many(
    `SELECT a.id, a.title, a.body, a.is_active, a.created_at, u.name AS author
       FROM announcements a LEFT JOIN users u ON u.id = a.created_by
      ORDER BY a.created_at DESC`
  );
  const items = rows.map((r) => ({ ...r, created_at: r.created_at.toISOString() }));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Announcements</h1>
      <p className="mt-1 max-w-prose text-soft">
        Live announcements show at the top of the home page (newest two) and on everyone’s dashboard.
      </p>
      <AnnouncementsManager initialItems={items} />
    </div>
  );
}
