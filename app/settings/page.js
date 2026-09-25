import { requireUserPage } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import RoleBadge from "@/components/RoleBadge";
import SettingsForms from "./SettingsForms";

export const metadata = { title: "Account settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserPage("/settings");
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-semibold">Account settings</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4 text-sm">
        <dt className="text-soft">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-soft">Role</dt>
        <dd><RoleBadge role={user.role} /></dd>
        <dt className="text-soft">Member since</dt>
        <dd>{formatDate(user.created_at)}</dd>
      </dl>
      <SettingsForms initialName={user.name} />
    </div>
  );
}
