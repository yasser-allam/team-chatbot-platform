import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitButton } from "../new/submit-button";
import { ConfirmButton } from "./confirm-button";
import { updateChatbot, deleteChatbot, addDocuments, deleteDocument } from "./actions";

type Bot = {
  id: string;
  name: string;
  instructions: string | null;
  team_id: string | null;
  teams: { name: string } | null;
};

type Doc = {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
};

const input =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none";

export default async function BotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { botId } = await params;
  const { error, saved } = await searchParams;

  // Layout already verified admin; admin client bypasses RLS.
  const admin = createAdminClient();
  const { data: botData } = await admin
    .from("chatbots")
    .select("id, name, instructions, team_id, teams(name)")
    .eq("id", botId)
    .single();
  if (!botData) notFound();
  const bot = botData as unknown as Bot;

  const { data: docData } = await admin
    .from("documents")
    .select("id, file_name, status, created_at")
    .eq("chatbot_id", botId)
    .order("created_at", { ascending: false });
  const docs = (docData ?? []) as Doc[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{bot.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Team: {bot.teams?.name ?? "—"}</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← All chatbots
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {saved && !error && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>
      )}

      {/* Edit settings */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Settings</h2>
        <form action={updateChatbot} className="mt-4 space-y-4">
          <input type="hidden" name="botId" value={bot.id} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" defaultValue={bot.name} required className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team</label>
            <input name="team" defaultValue={bot.teams?.name ?? ""} required className={input} />
            <p className="mt-1 text-xs text-gray-400">
              Only this team&apos;s members (and admins) can use the bot. Created if new.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instructions (optional)
            </label>
            <textarea
              name="instructions"
              defaultValue={bot.instructions ?? ""}
              rows={3}
              className={input}
              placeholder="e.g. Answer briefly and politely."
            />
          </div>
          <SubmitButton idle="Save changes" pendingLabel="Saving…" />
        </form>
      </section>

      {/* Documents */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">
          Documents{" "}
          <span className="font-normal text-gray-400">({docs.length})</span>
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          The bot answers only from these documents. Remove one to make it forget that source.
        </p>

        {docs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No documents yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-900">{d.file_name}</p>
                  <p className="text-xs text-gray-400">
                    <span
                      className={
                        d.status === "ready"
                          ? "text-green-600"
                          : d.status === "error"
                            ? "text-red-600"
                            : "text-amber-600"
                      }
                    >
                      {d.status}
                    </span>
                  </p>
                </div>
                <form action={deleteDocument}>
                  <input type="hidden" name="botId" value={bot.id} />
                  <input type="hidden" name="documentId" value={d.id} />
                  <ConfirmButton
                    message={`Remove "${d.file_name}"? The bot will forget it.`}
                    idle="Remove"
                    pendingLabel="Removing…"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Add documents */}
        <form action={addDocuments} className="mt-6 space-y-4 border-t border-gray-100 pt-5">
          <input type="hidden" name="botId" value={bot.id} />
          <h3 className="text-sm font-medium text-gray-800">Add documents</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload files</label>
            <input
              name="files"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">PDF, Word (.docx), .txt or .md.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Or paste text</label>
            <textarea name="pasted" rows={3} className={input} placeholder="Paste policy text here…" />
          </div>
          <SubmitButton idle="Add documents" pendingLabel="Adding… processing documents" />
        </form>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-red-700">Delete this chatbot</h2>
        <p className="mt-1 text-xs text-gray-500">
          Permanently removes the bot and all its documents. This cannot be undone.
        </p>
        <form action={deleteChatbot} className="mt-4">
          <input type="hidden" name="botId" value={bot.id} />
          <ConfirmButton
            message={`Delete "${bot.name}" and all its documents? This cannot be undone.`}
            idle="Delete chatbot"
            pendingLabel="Deleting…"
          />
        </form>
      </section>
    </div>
  );
}
