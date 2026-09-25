import Link from "next/link";
import { Check, Megaphone } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import RoleBadge from "@/components/RoleBadge";
import { many } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { paperHref } from "@/lib/ids";
import { shortAuthors } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  "federated learning in healthcare",
  "microplastics in freshwater fish",
  "mobile banking adoption",
];

const ROLES = [
  {
    role: "VISITOR",
    title: "As a visitor",
    text: "No account needed.",
    items: ["Search millions of papers", "Read abstracts and paper details", "Make citations in six styles", "See papers picked by the editors"],
  },
  {
    role: "USER",
    title: "With a free account",
    text: "Everything a visitor can do, plus:",
    items: [
      "Save papers to your own library",
      "Track what you are reading",
      "Write notes, methods and findings",
      "Compare papers side by side",
      "Summarize abstracts",
      "Export a whole reference list",
    ],
  },
  {
    role: "ADMIN",
    title: "As an admin",
    text: "Runs the site:",
    items: ["See site statistics", "Manage users and roles", "Suspend or remove accounts", "Feature papers on the home page", "Post announcements"],
  },
];

const STEPS = [
  ["Search", "Type a topic, title, author or DOI."],
  ["Save", "Keep useful papers in your library."],
  ["Take notes", "Record the method, findings and gaps."],
  ["Cite", "Copy a citation or export the whole list."],
];

async function loadHomeData() {
  try {
    const [featured, announcements] = await Promise.all([
      many("SELECT id, paper_id, title, authors, year, venue, note FROM featured_papers ORDER BY created_at DESC LIMIT 6"),
      many("SELECT id, title, body FROM announcements WHERE is_active ORDER BY created_at DESC LIMIT 2"),
    ]);
    return { featured, announcements };
  } catch {
    // Database not connected yet: the home page still works.
    return { featured: [], announcements: [] };
  }
}

export default async function HomePage() {
  const [{ featured, announcements }, user] = await Promise.all([loadHomeData(), getCurrentUser()]);

  return (
    <>
      {announcements.length > 0 && (
        <div className="border-b border-line bg-mark/25">
          <div className="container-page flex flex-col gap-1 py-2.5 text-sm">
            {announcements.map((a) => (
              <p key={a.id} className="flex items-start gap-2">
                <Megaphone size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">{a.title}</strong>
                  {a.body && <span className="text-ink/80"> {a.body}</span>}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Hero: the headline on the left, the search index card on the right */}
      <section className="container-page grid items-center gap-10 pb-16 pt-12 md:grid-cols-[1.05fr_1fr] md:pt-20 lg:gap-16">
        <div>
          <h1 className="text-[2.4rem] font-semibold leading-[1.08] sm:text-5xl lg:text-[3.6rem]">{site.tagline}</h1>
          <p className="mt-5 max-w-[46ch] text-lg text-soft">
            Search research papers from every field, save the useful ones to your library, and export citations in APA, MLA,
            IEEE and more.
          </p>
          {!user && (
            <p className="mt-6 text-sm text-soft">
              Searching is free.{" "}
              <Link href="/register" className="font-medium text-ink underline decoration-mark decoration-2 underline-offset-4">
                Create an account
              </Link>{" "}
              to keep a library.
            </p>
          )}
          {user && (
            <p className="mt-6 text-sm text-soft">
              Welcome back, {user.name.split(" ")[0]}.{" "}
              <Link href="/dashboard" className="font-medium text-ink underline decoration-mark decoration-2 underline-offset-4">
                Go to your dashboard
              </Link>
            </p>
          )}
        </div>

        <div className="index-card px-5 pb-5 sm:px-6">
          <div className="flex h-[58px] items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">Search papers</h2>
            <span className="text-xs text-soft">No account needed</span>
          </div>
          <div className="flex h-[72px] items-center pt-[2px]">
            <SearchBar size="hero" />
          </div>
          <ul className="text-sm" aria-label="Example searches">
            <li className="flex h-8 items-end pb-[6px] text-soft">Try one of these:</li>
            {EXAMPLES.map((ex) => (
              <li key={ex} className="flex h-8 items-end pb-[6px]">
                <Link href={`/search?q=${encodeURIComponent(ex)}`} className="font-serif italic hover:underline hover:decoration-mark hover:decoration-2">
                  {ex}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page py-10" aria-labelledby="featured-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 id="featured-heading" className="text-2xl font-semibold">
              Picked by the editors
            </h2>
            <span className="text-sm text-soft">{featured.length === 1 ? "1 paper" : `${featured.length} papers`}</span>
          </div>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {featured.map((f) => (
              <li key={f.id} className="border-b border-line py-5">
                <Link href={paperHref(f.paper_id)} className="font-serif text-lg font-semibold leading-snug hover:underline hover:decoration-mark hover:decoration-2 hover:underline-offset-4">
                  {f.title}
                </Link>
                <p className="mt-1 text-sm text-soft">
                  {shortAuthors(f.authors, 3)}
                  {f.venue && (
                    <>
                      , <i className="font-serif">{f.venue}</i>
                    </>
                  )}
                  {f.year && ` (${f.year})`}
                </p>
                {f.note && <p className="mt-2 border-l-2 border-mark pl-3 text-sm">{f.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {featured.length === 0 && user?.role === "ADMIN" && (
        <section className="container-page py-4">
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-soft">
            Admin tip: open any paper and choose <strong className="text-ink">Feature on home page</strong>, or add papers in{" "}
            <Link href="/admin/featured" className="underline underline-offset-2">
              Admin, Featured papers
            </Link>
            . They will appear here.
          </p>
        </section>
      )}

      <section className="container-page py-14" aria-labelledby="roles-heading">
        <h2 id="roles-heading" className="text-2xl font-semibold sm:text-3xl">
          What you can do here
        </h2>
        <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
          {ROLES.map((r) => (
            <div key={r.role} className="border-t-2 border-ink pt-5">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{r.title}</h3>
                <RoleBadge role={r.role} />
              </div>
              <p className="mt-1 text-sm text-soft">{r.text}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {r.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="text-2xl font-semibold sm:text-3xl">
          From search to reference list
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="font-serif text-4xl font-semibold leading-none text-ink/25" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="font-sans text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        {!user && (
          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-primary h-11 px-6">
              Create a free account
            </Link>
            <Link href="/search" className="btn-outline h-11 px-6">
              Start searching
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
