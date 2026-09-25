import Link from "next/link";
import { many, one } from "@/lib/db";
import { paperHref } from "@/lib/ids";
import { formatNumber, plural, timeAgo } from "@/lib/format";
import BarChart from "@/components/BarChart";
import RoleBadge from "@/components/RoleBadge";

export const metadata = { title: "Admin overview" };

const dayLabel = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function AdminOverview() {
  const [stats, signups, saves, topPapers, recentUsers] = await Promise.all([
    one(`SELECT
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_users,
      (SELECT COUNT(*) FROM users WHERE role = 'ADMIN')::int AS admins,
      (SELECT COUNT(*) FROM users WHERE is_suspended)::int AS suspended,
      (SELECT COUNT(*) FROM saved_papers)::int AS saves,
      (SELECT COUNT(DISTINCT user_id) FROM saved_papers)::int AS readers,
      (SELECT COUNT(*) FROM featured_papers)::int AS featured,
      (SELECT COUNT(*) FROM announcements WHERE is_active)::int AS announcements`),
    many(`SELECT d::date AS day, COUNT(u.id)::int AS n
            FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, INTERVAL '1 day') d
            LEFT JOIN users u ON u.created_at::date = d::date
           GROUP BY d ORDER BY d`),
    many(`SELECT d::date AS day, COUNT(s.id)::int AS n
            FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, INTERVAL '1 day') d
            LEFT JOIN saved_papers s ON s.created_at::date = d::date
           GROUP BY d ORDER BY d`),
    many(`SELECT paper_id, MIN(title) AS title, COUNT(*)::int AS n
            FROM saved_papers GROUP BY paper_id ORDER BY n DESC, title LIMIT 5`),
    many("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
  ]);

  const cards = [
    { label: "Users", value: stats.users, sub: `${stats.new_users} new this week` },
    { label: "Papers saved", value: stats.saves, sub: `by ${plural(stats.readers, "reader")}` },
    { label: "Admins", value: stats.admins, sub: `${plural(stats.suspended, "suspended user")}` },
    { label: "On the home page", value: stats.featured, sub: `${plural(stats.announcements, "live announcement")}` },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold">Overview</h1>
      <p className="mt-1 text-soft">How the site is being used.</p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface p-5">
            <dt className="text-sm text-soft">{c.label}</dt>
            <dd className="mt-1 font-serif text-3xl font-semibold">{formatNumber(c.value)}</dd>
            <dd className="mt-1 text-xs text-soft">{c.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-sans text-sm font-semibold">New accounts, last 14 days</h2>
          <div className="mt-4">
            <BarChart label="New accounts" data={signups.map((r) => ({ label: dayLabel(r.day), value: r.n }))} />
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-sans text-sm font-semibold">Papers saved, last 14 days</h2>
          <div className="mt-4">
            <BarChart label="Papers saved" data={saves.map((r) => ({ label: dayLabel(r.day), value: r.n }))} />
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="border-b border-line pb-2 text-lg font-semibold">Most saved papers</h2>
          {topPapers.length === 0 ? (
            <p className="py-4 text-sm text-soft">No papers saved yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {topPapers.map((p) => (
                <li key={p.paper_id} className="flex items-start justify-between gap-4 py-3">
                  <Link href={paperHref(p.paper_id)} className="font-serif text-sm font-semibold leading-snug hover:underline">
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-sm text-soft">{plural(p.n, "save")}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <h2 className="text-lg font-semibold">Newest users</h2>
            <Link href="/admin/users" className="text-sm text-soft hover:text-ink">
              Manage users
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {u.name} <RoleBadge role={u.role} />
                  </p>
                  <p className="truncate text-xs text-soft">{u.email}</p>
                </div>
                <span className="shrink-0 text-xs text-soft">{timeAgo(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
