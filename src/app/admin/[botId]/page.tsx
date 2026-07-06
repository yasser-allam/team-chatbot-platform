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

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "ready"
      ? "bg-sage-50 text-sage-700"
      : status === "error"
        ? "bg-[#fbece7] text-[#b0472e]"
        : "bg-[#fbf3e2] text-[#a9762a]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>
      {status}
    </span>
  );
}

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sage-100 text-xl">
            💬
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {bot.name}
            </h1>
            <p className="text-sm text-ink-soft">{bot.teams?.name ?? "—"} team</p>
          </div>
        </div>
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← All chatbots
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-[#fbece7] px-3 py-2 text-sm text-[#b0472e]">{error}</p>
      )}
      {saved && !error && (
        <p className="rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700">Saved.</p>
      )}

      {/* Edit settings */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Settings</h2>
        <form action={updateChatbot} className="mt-4 space-y-4">
          <input type="hidden" name="botId" value={bot.id} />
          <div>
            <label className="label">Name</label>
            <input name="name" defaultValue={bot.name} required className="field" />
          </div>
          <div>
            <label className="label">Team</label>
            <input name="team" defaultValue={bot.teams?.name ?? ""} required className="field" />
            <p className="hint mt-1">
              Only this team&apos;s members (and admins) can use the bot. Created if new.
            </p>
          </div>
          <div>
            <label className="label">Instructions (optional)</label>
            <textarea
              name="instructions"
              defaultValue={bot.instructions ?? ""}
              rows={3}
              className="field"
              placeholder="e.g. Answer briefly and politely."
            />
          </div>
          <SubmitButton idle="Save changes" pendingLabel="Saving…" />
        </form>
      </section>

      {/* Documents */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Documents <span className="font-sans text-sm font-normal text-ink-soft">({docs.length})</span>
        </h2>
        <p className="hint mt-1">
          The bot answers only from these. Remove one to make it forget that source.
        </p>

        {docs.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No documents yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{d.file_name}</p>
                    <p className="mt-0.5"><StatusPill status={d.status} /></p>
                  </div>
                </div>
                <form action={deleteDocument}>
                  <input type="hidden" name="botId" value={bot.id} />
                  <input type="hidden" name="documentId" value={d.id} />
                  <ConfirmButton
                    message={`Remove "${d.file_name}"? The bot will forget it.`}
                    idle="Remove"
                    pendingLabel="Removing…"
                    className="btn btn-secondary px-3 py-1.5 text-xs"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Add documents */}
        <form action={addDocuments} className="mt-6 space-y-4 border-t border-line pt-5">
          <input type="hidden" name="botId" value={bot.id} />
          <h3 className="text-sm font-semibold text-ink">Add documents</h3>
          <div>
            <label className="label">Upload files</label>
            <input
              name="files"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-sage-700"
            />
            <p className="hint mt-1">PDF, Word (.docx), .txt or .md.</p>
          </div>
          <div>
            <label className="label">Or paste text</label>
            <textarea name="pasted" rows={3} className="field" placeholder="Paste policy text here…" />
          </div>
          <SubmitButton idle="Add documents" pendingLabel="Adding… processing documents" />
        </form>
      </section>

      {/* Danger zone */}
      <section className="card border-[#e7c6ba] p-6">
        <h2 className="font-display text-lg font-semibold text-[#b0472e]">
          Delete this chatbot
        </h2>
        <p className="hint mt-1">
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
