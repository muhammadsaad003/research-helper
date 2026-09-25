import { Suspense } from "react";
import LibraryClient from "./LibraryClient";

export const metadata = { title: "My library" };

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="container-page py-10"><div className="skeleton h-10 w-60" /></div>}>
      <LibraryClient />
    </Suspense>
  );
}
