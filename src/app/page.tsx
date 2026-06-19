import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role, team_id, full_name").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Team Chatbots</h1>
        <p className="mt-1 text-sm text-gray-500">Signed in as {user.email}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="font-medium text-gray-900">{profile?.role ?? "employee"}</dd></div>
        </dl>
        <Link href="/chat" className="mt-6 block rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800">
          Chat with a bot
        </Link>
        {isAdmin && (
          <Link href="/admin" className="mt-3 block rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
            Admin: manage chatbots
          </Link>
        )}
        <form action="/auth/signout" method="post" className="mt-3">
          <button className="w-full rounded-md px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-700">Sign out</button>
        </form>
      </div>
    </main>
  );
}
