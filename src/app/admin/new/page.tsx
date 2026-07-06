import Link from "next/link";
import { createChatbot } from "./actions";
import { SubmitButton } from "./submit-button";

export default async function NewChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          New chatbot
        </h1>
        <Link href="/admin" className="btn btn-ghost text-sm">
          Cancel
        </Link>
      </div>

      {params.error && (
        <p className="mt-4 rounded-xl bg-[#fbece7] px-3 py-2 text-sm text-[#b0472e]">
          {params.error}
        </p>
      )}

      <form action={createChatbot} className="card mt-6 space-y-5 p-6">
        <div>
          <label className="label">Chatbot name</label>
          <input name="name" required placeholder="e.g. Accounting Assistant" className="field" />
        </div>

        <div>
          <label className="label">Team</label>
          <input name="team" required placeholder="e.g. Accounting" className="field" />
          <p className="hint mt-1">
            If the team doesn&apos;t exist yet, it&apos;s created automatically.
          </p>
        </div>

        <div>
          <label className="label">How should this bot behave? (optional)</label>
          <textarea
            name="instructions"
            rows={3}
            placeholder="e.g. Be concise and formal. If unsure, tell the user to check with their manager."
            className="field"
          />
        </div>

        <div>
          <label className="label">Upload documents</label>
          <input
            name="files"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-sage-700"
          />
          <p className="hint mt-1">
            PDF, Word (.docx), or text (.txt, .md). You can select several.
          </p>
        </div>

        <div>
          <label className="label">…or paste text directly (optional)</label>
          <textarea
            name="pasted"
            rows={4}
            placeholder="Paste regulations or notes here."
            className="field"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton />
          <span className="hint">Processing documents can take up to a minute.</span>
        </div>
      </form>
    </div>
  );
}
