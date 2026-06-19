import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BotRow = { id: string; name: string; teams: { name: string } | null };

export default async function ChatHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("chatbots")
    .select("id, name, teams(name)")
    .order("created_at", { ascending: false });
  const bots = (data ?? []) as unknown as BotRow[];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-gray-900">Team Chatbots</span>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Choose a chatbot</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a team assistant to ask questions.
        </p>
        {bots.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">No chatbots available yet.</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link
                  href={`/chat/${bot.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-900"
                >
                  <p className="font-medium text-gray-900">{bot.name}</p>
                  <p className="text-xs text-gray-500">
                    {bot.teams?.name ?? "—"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
