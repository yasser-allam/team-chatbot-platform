import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/brand";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id, full_name")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";
  const greeting = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Wordmark />
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost text-sm">Sign out</button>
        </form>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <div className="rise">
          <p className="chip">
            {isAdmin ? "Administrator" : "Team member"}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
            Hello, {greeting}.
          </h1>
          <p className="mt-2 max-w-md text-ink-soft">
            Ask a question and get an answer grounded in your company&apos;s own
            documents — no more digging through folders.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/chat" className="card group p-6 transition hover:-translate-y-0.5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sage-100 text-2xl">
              💬
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              Chat with a bot
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Ask your team&apos;s assistant anything about its documents.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-sage-700">
              Start chatting →
            </span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className="card group p-6 transition hover:-translate-y-0.5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-sage-100 text-2xl">
                ⚙️
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink">
                Manage chatbots
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Create bots, add documents, and manage who can use them.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-sage-700">
                Open admin →
              </span>
            </Link>
          )}
        </div>

        <p className="mt-10 text-xs text-ink-soft">Signed in as {user.email}</p>
      </main>
    </div>
  );
}
