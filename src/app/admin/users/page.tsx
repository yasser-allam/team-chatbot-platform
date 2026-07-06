import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type Row = {
  id: string;
  email: string | null;
  role: string;
  teams: { name: string } | null;
};

export default async function UsersPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, role, teams(name)")
    .order("created_at", { ascending: true });
  const users = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Users
          </h1>
          <p className="mt-1.5 text-ink-soft">
            People who can sign in, and which team they belong to.
          </p>
        </div>
        <Link href="/admin/users/new" className="btn btn-primary shrink-0">
          + Add user
        </Link>
      </div>

      <div className="card mt-6 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-sage-50 text-left text-xs font-semibold uppercase tracking-wide text-sage-700">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Team</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-5 py-3 text-ink">{u.email ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="chip">{u.role}</span>
                </td>
                <td className="px-5 py-3 text-ink-soft">{u.teams?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
