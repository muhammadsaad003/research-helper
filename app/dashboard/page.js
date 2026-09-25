import Link from "next/link";
import { BookOpen, Megaphone, Search, ShieldCheck, Table2 } from "lucide-react";
import { requireUserPage, isAdmin } from "@/lib/auth";
import { many, one } from "@/lib/db";
import { STATUS, shortAuthors, timeAgo } from "@/lib/format";
import RoleBadge from "@/components/RoleBadge";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const user = await requireUserPage("/dashboard");
  const sp = await searchParams;

  const [counts, recent, announcements, tagRows] = await Promise.all([
    one(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'TO_READ')::int AS to_read,
              COUNT(*) FILTER (WHERE status = 'READING')::int AS reading,
              COUNT(*) FILTER (WHERE status = 'DONE')::int AS done
         FROM saved_papers WHERE user_id = $1`,
      [user.id]
    ),
    many("SELECT id, title, authors, year, venue, status, updated_at FROM saved_papers WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5", [user.id]),
    many("SELECT id, title, body, created_at FROM announcements WHERE is_active ORDER BY created_at DESC LIMIT 3"),
    many("SELECT tag, COUNT(*)::int AS n FROM saved_papers, unnest(tags) AS tag WHERE user_id = $1 GROUP BY tag ORDER BY n DESC LIMIT 8", [user.id]),
  ]);

  const donePct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  const bars = [
    { key: "TO_READ", n: counts.to_read },
    { key: "READING", n: counts.reading },
    { key: "DONE", n: counts.done },
  ];

  return (
    <div className="container-page py-10">
      {sp?.denied && (
        <p role="alert" className="mb-6 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          That page is for admins only.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">Hello, {user.name.split(" ")[0]}</h1>
        <RoleBadge role={user.role} />
      </div>
      <p className="mt-1 text-soft">Here’s where your reading stands.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="panel p-6" aria-labelledby="progress-heading">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="progress-heading" className="font-sans text-sm font-semibold">
                  Reading progress
                </h2>
                <p className="mt-1 font-serif text-4xl font-semibold">
                  {counts.done}
                  <span className="text-xl font-normal text-soft"> of {counts.total} {counts.total === 1 ? "paper" : "papers"} read</span>
                </p>
              </div>
              <p className="text-sm text-soft">{donePct}% done</p>
            </div>
            {counts.total > 0 && (
              <>
                <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${counts.to_read} to read, ${counts.reading} reading, ${counts.done} done`}>
                  {bars.map((b) =>
                    b.n ? <div key={b.key} className={STATUS[b.key].dot} style={{ width: `${(b.n / counts.total) * 100}%` }} /> : null
                  )}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {bars.map((b) => (
                    <li key={b.key} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${STATUS[b.key].dot}`} aria-hidden="true" />
                      <Link href={`/library?status=${b.key}`} className="hover:underline">
                        {STATUS[b.key].label}: {b.n}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 id="recent-heading" className="text-xl font-semibold">
                Recently updated
              </h2>
              {recent.length > 0 && (
                <Link href="/library" className="text-sm text-soft hover:text-ink">
                  Open library
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="mt-6">
                <EmptyState icon={BookOpen} title="Your library is empty" action={<Link href="/search" className="btn-primary">Find papers</Link>}>
                  Search for a topic and choose “Save to library” on any paper.
                </EmptyState>
              </div>
            ) : (
              <ul>
                {recent.map((p) => (
                  <li key={p.id} className="border-b border-line py-4">
                    <Link href={`/library/${p.id}`} className="font-serif text-lg font-semibold leading-snug hover:underline hover:decoration-mark hover:decoration-2">
                      {p.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-soft">
                      <span>{shortAuthors(p.authors, 2)}{p.year ? ` (${p.year})` : ""}</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${STATUS[p.status].dot}`} aria-hidden="true" />
                        {STATUS[p.status].label}
                      </span>
                      <span>updated {timeAgo(p.updated_at)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <nav className="panel p-2" aria-label="Quick links">
            <Link href="/search" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-ink/5">
              <Search size={18} /> Search papers
            </Link>
            <Link href="/library" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-ink/5">
              <BookOpen size={18} /> My library
            </Link>
            <Link href="/compare" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-ink/5">
              <Table2 size={18} /> Compare papers
            </Link>
            {isAdmin(user) && (
              <Link href="/admin" className="flex items-center gap-3 rounded-md bg-mark/30 px-3 py-2.5 text-sm font-medium hover:bg-mark/50">
                <ShieldCheck size={18} /> Admin panel
              </Link>
            )}
          </nav>

          {tagRows.length > 0 && (
            <section className="panel p-4" aria-labelledby="tags-heading">
              <h2 id="tags-heading" className="font-sans text-sm font-semibold">
                Your tags
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {tagRows.map((t) => (
                  <li key={t.tag}>
                    <Link href={`/library?tag=${encodeURIComponent(t.tag)}`} className="chip hover:border-ink/40 hover:text-ink">
                      #{t.tag} <span className="text-soft/70">{t.n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {announcements.length > 0 && (
            <section className="panel p-4" aria-labelledby="news-heading">
              <h2 id="news-heading" className="flex items-center gap-2 font-sans text-sm font-semibold">
                <Megaphone size={16} /> From the admin
              </h2>
              <ul className="mt-3 space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="border-l-2 border-mark pl-3">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.body && <p className="text-sm text-soft">{a.body}</p>}
                    <p className="mt-0.5 text-xs text-soft">{timeAgo(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
