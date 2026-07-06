import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Wordmark } from "@/components/brand";

type BotRow = { id: string; name: string; teams: { name: string } | null };

export default async function ChatHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const admin = createAdminClient();
  let bots: BotRow[] = [];
  let noTeam = false;
  if (isAdmin) {
    const { data } = await admin
      .from("chatbots")
      .select("id, name, teams(name)")
      .order("created_at", { ascending: false });
    bots = (data ?? []) as unknown as BotRow[];
  } else if (profile?.team_id) {
    const { data } = await admin
      .from("chatbots")
      .select("id, name, teams(name)")
      .eq("team_id", profile.team_id)
      .order("created_at", { ascending: false });
    bots = (data ?? []) as unknown as BotRow[];
  } else {
    noTeam = true;
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Wordmark />
        <Link href="/" className="btn btn-ghost text-sm">
          Home
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Choose an assistant
        </h1>
        <p className="mt-1.5 text-ink-soft">Pick a team bot to ask questions.</p>

        {noTeam ? (
          <div className="card mt-6 p-6">
            <p className="text-sm text-ink">
              You&apos;re not assigned to a team yet.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Ask your administrator to add you to one, then your team&apos;s bot
              will appear here.
            </p>
          </div>
        ) : bots.length === 0 ? (
          <div className="card mt-6 p-6 text-sm text-ink-soft">
            No chatbots available for your team yet.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {bots.map((bot, i) => (
              <li key={bot.id} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  href={`/chat/${bot.id}`}
                  className="card group flex h-full items-start gap-3 p-5 transition hover:-translate-y-0.5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-xl">
                    💬
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold text-ink">
                      {bot.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {bot.teams?.name ?? "—"} team
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
