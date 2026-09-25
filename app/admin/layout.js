import { requireAdminPage } from "@/lib/auth";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  await requireAdminPage();
  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
        <aside>
          <p className="mb-3 hidden font-serif text-lg font-semibold lg:block">Admin</p>
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
