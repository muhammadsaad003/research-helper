"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import RoleBadge from "@/components/RoleBadge";
import { formatDate } from "@/lib/format";

export default function UsersTable({ myId }) {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (res.ok) setUsers(data.users);
    else toast.error(data.error || "Couldn't load users.");
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  // Search as you type, but wait until typing pauses.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function patch(user, body, message) {
    setBusyId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) return toast.error(data.error || "Couldn't update the user.");
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, ...data.user } : u)));
    toast.success(message);
  }

  async function confirmDelete() {
    setBusyId(toDelete.id);
    const res = await fetch(`/api/admin/users/${toDelete.id}`, { method: "DELETE" });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) return toast.error(data.error || "Couldn't delete the user.");
    setUsers((list) => list.filter((u) => u.id !== toDelete.id));
    toast.success(`Deleted ${toDelete.name}`);
    setToDelete(null);
  }

  return (
    <div className="mt-6">
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft" aria-hidden="true" />
        <input aria-label="Search users" className="field pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/70 text-xs text-soft">
              <th scope="col" className="px-4 py-3 font-medium">Person</th>
              <th scope="col" className="px-4 py-3 font-medium">Joined</th>
              <th scope="col" className="px-4 py-3 font-medium">Saved</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
              <th scope="col" className="px-4 py-3 font-medium">Access</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {!users && (
              <tr>
                <td colSpan={6} className="px-4 py-6">
                  <div className="skeleton h-5 w-2/3" />
                </td>
              </tr>
            )}
            {users?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-soft">No users match “{query}”.</td>
              </tr>
            )}
            {users?.map((u) => {
              const me = u.id === myId;
              return (
                <tr key={u.id} className={`border-b border-line last:border-0 ${u.is_suspended ? "bg-danger/5" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-2 font-medium">
                      {u.name} {me && <span className="text-xs font-normal text-soft">(you)</span>}
                    </p>
                    <p className="text-xs text-soft">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-soft">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">{u.saved}</td>
                  <td className="px-4 py-3">
                    {me ? (
                      <RoleBadge role={u.role} />
                    ) : (
                      <>
                        <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                        <select
                          id={`role-${u.id}`}
                          className="field h-8 w-auto py-0 text-xs"
                          value={u.role}
                          disabled={busyId === u.id}
                          onChange={(e) => patch(u, { role: e.target.value }, e.target.value === "ADMIN" ? `${u.name} is now an admin` : `${u.name} is now a user`)}
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {me ? (
                      <span className="text-xs text-soft">Active</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => patch(u, { is_suspended: !u.is_suspended }, u.is_suspended ? `${u.name} can log in again` : `${u.name} is suspended`)}
                        className={`btn-sm btn ${u.is_suspended ? "border border-ok/50 text-ok hover:bg-ok/10" : "border border-line text-ink hover:border-danger/60 hover:text-danger"}`}
                      >
                        {u.is_suspended ? "Unsuspend" : "Suspend"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!me && (
                      <button type="button" onClick={() => setToDelete(u)} className="btn-ghost h-8 w-8 p-0 text-danger" aria-label={`Delete ${u.name}`} title="Delete account">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-soft">Suspended people can’t log in or use their library. Nothing is deleted until you choose Delete.</p>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        busy={busyId === toDelete?.id}
        title="Delete this account?"
        message={toDelete ? `${toDelete.name} (${toDelete.email}) and their ${toDelete.saved} saved papers will be deleted for good. Suspending is the gentler option.` : ""}
        confirmLabel="Delete account"
      />
    </div>
  );
}
