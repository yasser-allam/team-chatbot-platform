import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatClient } from "./chat-client";
import { LeafMark } from "@/components/brand";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const { data: bot } = await admin
    .from("chatbots")
    .select("id, name, team_id, teams(name)")
    .eq("id", id)
    .single();
  if (!bot) notFound();

  const botTeamId = (bot as { team_id: string | null }).team_id;
  if (!isAdmin && botTeamId !== profile?.team_id) notFound();

  const t = (bot as { teams: unknown }).teams;
  const teamName =
    (Array.isArray(t) ? t[0]?.name : (t as { name?: string } | null)?.name) ?? "";

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <LeafMark size={36} />
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-ink">
                {bot.name}
              </p>
              {teamName && (
                <p className="text-xs text-ink-soft">{teamName} team</p>
              )}
            </div>
          </div>
          <Link href="/chat" className="btn btn-ghost text-sm">
            All bots
          </Link>
        </div>
      </header>
      <ChatClient chatbotId={bot.id} botName={bot.name} />
    </main>
  );
}
