"use client";

export default function Error({ error, reset }) {
  const dbProblem = /DATABASE_URL|ECONNREFUSED|password authentication|getaddrinfo/i.test(error?.message || "");
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg rounded-lg border border-danger/40 bg-surface p-6">
        <h1 className="text-2xl font-semibold">Something went wrong on this page</h1>
        <p className="mt-2 text-soft">
          {dbProblem
            ? "The site can’t reach its database. If you run this site, check DATABASE_URL in your environment variables."
            : "Try again. If it keeps happening and you run this site, check the logs in Vercel (your project, then Logs)."}
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    </div>
  );
}
