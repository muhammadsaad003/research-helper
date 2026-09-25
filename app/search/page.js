import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = { title: "Search papers" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page py-10"><div className="skeleton h-11 w-full" /></div>}>
      <SearchClient />
    </Suspense>
  );
}
