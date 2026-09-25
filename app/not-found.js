import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex justify-center py-20">
      <div className="index-card plain w-full max-w-md px-8 pb-8">
        <div className="flex h-[58px] items-center">
          <h1 className="text-xl font-semibold">Page not found</h1>
        </div>
        <p className="pt-5 text-soft">
          This page or paper doesn’t exist. If you followed a DOI, check it for typos. Or search for the paper by its title.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/search" className="btn-primary">Search papers</Link>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </div>
    </div>
  );
}
