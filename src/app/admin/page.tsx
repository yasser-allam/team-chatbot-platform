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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Your chatbots
          </h1>
          <p className="mt-1.5 text-ink-soft">
            Create an assistant for a team and feed it documents to learn from.
          </p>
        </div>
        <Link href="/admin/new" className="btn btn-primary shrink-0">
          + New chatbot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-2xl">
            💬
          </div>
          <p className="mt-4 font-medium text-ink">No chatbots yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Click “+ New chatbot” to create your first one.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bots.map((bot, i) => (
            <li key={bot.id} className="rise" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                href={`/admin/${bot.id}`}
                className="card group flex items-center justify-between p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-100 text-lg">
                    💬
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {bot.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {bot.teams?.name ?? "—"} team
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-sage-700 opacity-0 transition group-hover:opacity-100">
                  Manage →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
