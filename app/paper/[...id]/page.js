import { notFound, redirect } from "next/navigation";
import { ExternalLink, Unlock } from "lucide-react";
import { getPaper } from "@/lib/papers";
import { idFromSegments, paperHref } from "@/lib/ids";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { one } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import BackButton from "@/components/BackButton";
import AuthorList from "@/components/AuthorList";
import SaveButton from "@/components/SaveButton";
import CitePanel from "@/components/CitePanel";
import SummaryPanel from "@/components/SummaryPanel";
import FeatureButton from "@/components/FeatureButton";

const TYPE_LABELS = {
  article: "Article",
  "journal-article": "Journal article",
  "proceedings-article": "Conference paper",
  "book-chapter": "Book chapter",
  book: "Book",
  review: "Review",
  preprint: "Preprint",
  "posted-content": "Preprint",
  dissertation: "Thesis",
  dataset: "Dataset",
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const paper = await getPaper(idFromSegments(id));
  return { title: paper ? paper.title.slice(0, 90) : "Paper not found", description: paper?.abstract?.slice(0, 160) };
}

export default async function PaperPage({ params }) {
  const { id } = await params;
  const requested = idFromSegments(id);
  const paper = await getPaper(requested);
  if (!paper) notFound();
  if (paper.id !== requested) redirect(paperHref(paper.id));

  const user = await getCurrentUser();
  let saved = null;
  let featured = null;
  if (user) {
    saved = await one("SELECT id, summary FROM saved_papers WHERE user_id = $1 AND paper_id = $2", [user.id, paper.id]).catch(() => null);
  }
  if (isAdmin(user)) {
    featured = await one("SELECT id FROM featured_papers WHERE paper_id = $1", [paper.id]).catch(() => null);
  }

  const details = [
    paper.volume && `Volume ${paper.volume}`,
    paper.issue && `issue ${paper.issue}`,
    paper.pages && `pages ${paper.pages}`,
  ].filter(Boolean);

  return (
    <div className="container-page py-8">
      <BackButton />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
        <article className="min-w-0">
          {paper.type && <p className="text-sm text-soft">{TYPE_LABELS[paper.type] || paper.type.replace(/-/g, " ")}</p>}
          <h1 className="mt-1 text-3xl font-semibold leading-tight sm:text-[2.4rem]">{paper.title}</h1>
          <div className="mt-4">
            <AuthorList authors={paper.authors} />
          </div>
          <p className="mt-2 text-[0.95rem]">
            {paper.venue && <i className="font-serif">{paper.venue}</i>}
            {paper.year && <span className="text-soft"> ({paper.year})</span>}
            {details.length > 0 && <span className="text-soft">. {details.join(", ")}</span>}
          </p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-4 text-sm">
            {paper.citedBy !== null && (
              <div>
                <dt className="text-soft">Cited by</dt>
                <dd className="font-serif text-xl font-semibold">{formatNumber(paper.citedBy)}</dd>
              </div>
            )}
            {paper.doi && (
              <div className="min-w-0">
                <dt className="text-soft">DOI</dt>
                <dd className="truncate">
                  <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">
                    {paper.doi}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-soft">Access</dt>
              <dd>{paper.isOa ? <span className="text-ok">Free to read</span> : "Check publisher or your library"}</dd>
            </div>
          </dl>

          <section className="mt-8" aria-labelledby="abstract-heading">
            <h2 id="abstract-heading" className="text-xl font-semibold">
              Abstract
            </h2>
            {paper.abstract ? (
              <p className="prose-reading mt-3">{paper.abstract}</p>
            ) : (
              <p className="mt-3 text-sm text-soft">The databases don’t have an abstract for this paper. Open the publisher page to read it.</p>
            )}
          </section>

          {paper.topics?.length > 0 && (
            <section className="mt-8" aria-labelledby="topics-heading">
              <h2 id="topics-heading" className="text-sm font-semibold">
                Topics
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {paper.topics.map((t) => (
                  <li key={t}>
                    <a href={`/search?q=${encodeURIComponent(t)}`} className="chip hover:border-ink/40 hover:text-ink">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="panel space-y-2 p-4">
            <SaveButton paper={paper} initialSaved={Boolean(saved)} size="md" block />
            {saved && (
              <a href={`/library/${saved.id}`} className="btn-ghost btn-sm w-full">
                Open your notes
              </a>
            )}
            {paper.oaUrl && (
              <a href={paper.oaUrl} target="_blank" rel="noreferrer" className="btn-outline w-full text-ok">
                <Unlock size={16} /> Read free full text
              </a>
            )}
            {paper.url && (
              <a href={paper.url} target="_blank" rel="noreferrer" className="btn-outline w-full">
                <ExternalLink size={16} /> Publisher page
              </a>
            )}
          </div>

          <section className="panel p-4" aria-labelledby="cite-heading">
            <h2 id="cite-heading" className="mb-3 font-sans text-sm font-semibold">
              Cite this paper
            </h2>
            <CitePanel paper={paper} compact />
          </section>

          <section className="panel p-4" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="mb-3 font-sans text-sm font-semibold">
              Quick summary
            </h2>
            <SummaryPanel paperId={paper.id} savedId={saved?.id} hasAbstract={Boolean(paper.abstract)} initialSummary={saved?.summary || null} />
          </section>

          {isAdmin(user) && (
            <section className="panel border-mark p-4" aria-labelledby="admin-heading">
              <h2 id="admin-heading" className="mb-3 font-sans text-sm font-semibold">
                Admin
              </h2>
              <FeatureButton paperId={paper.id} initialFeatured={Boolean(featured)} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
