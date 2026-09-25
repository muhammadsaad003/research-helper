import { getCurrentUser } from "@/lib/auth";
import UsersTable from "./UsersTable";

export const metadata = { title: "Manage users" };

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  return (
    <div>
      <h1 className="text-3xl font-semibold">Users</h1>
      <p className="mt-1 text-soft">Change roles, suspend accounts that break the rules, or remove them.</p>
      <UsersTable myId={me.id} />
    </div>
  );
}
