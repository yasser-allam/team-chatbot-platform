import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type BotRow = {
  id: string;
  name: string;
  instructions: string | null;
  teams: { name: string } | null;
};

export default async function AdminDashboard() {
  // Layout already verified the user is an admin, so we can use the admin
  // client (bypasses RLS) to read all bots.
  const admin = createAdminClient();
  const { data } = await admin
    .from("chatbots")
    .select("id, name, instructions, teams(name)")
    .order("created_at", { ascending: false });
  const bots = (data ?? []) as unknown as BotRow[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Your chatbots</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a chatbot for a team and give it documents to learn from.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + New chatbot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            No chatbots yet. Click “+ New chatbot” to create your first one.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bots.map((bot) => (
            <li key={bot.id}>
              <Link
                href={`/admin/${bot.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-400"
              >
                <div>
                  <p className="font-medium text-gray-900">{bot.name}</p>
                  <p className="text-xs text-gray-500">
                    Team: {bot.teams?.name ?? "—"}
                  </p>
                </div>
                <span className="text-sm text-gray-400">Manage →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
