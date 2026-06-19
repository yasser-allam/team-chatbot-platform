import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatClient } from "./chat-client";

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
  const teamName = (Array.isArray(t) ? t[0]?.name : (t as { name?: string } | null)?.name) ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-semibold text-gray-900">{bot.name}</p>
            {teamName && <p className="text-xs text-gray-500">{teamName} team</p>}
          </div>
          <Link href="/chat" className="text-sm text-gray-500 hover:text-gray-900">All bots</Link>
        </div>
      </header>
      <ChatClient chatbotId={bot.id} botName={bot.name} />
    </main>
  );
}
