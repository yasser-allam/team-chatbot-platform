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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            People who can sign in, and which team they belong to.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add user
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Team</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-900">{u.email ?? "—"}</td>
                <td className="px-4 py-2 text-gray-600">{u.role}</td>
                <td className="px-4 py-2 text-gray-600">{u.teams?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
