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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">New chatbot</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          Cancel
        </Link>
      </div>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form action={createChatbot} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Chatbot name
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Accounting Assistant"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Team</label>
          <input
            name="team"
            required
            placeholder="e.g. Accounting"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            If the team doesn’t exist yet, it’s created automatically.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            How should this bot behave? (optional)
          </label>
          <textarea
            name="instructions"
            rows={3}
            placeholder="e.g. Be concise and formal. If unsure, tell the user to check with their manager."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload documents
          </label>
          <input
            name="files"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="mt-1 w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium"
          />
          <p className="mt-1 text-xs text-gray-400">
            PDF, Word (.docx), or text (.txt, .md). You can select several.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            …or paste text directly (optional)
          </label>
          <textarea
            name="pasted"
            rows={4}
            placeholder="Paste regulations or notes here."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton />
          <span className="text-xs text-gray-400">
            Processing documents can take up to a minute.
          </span>
        </div>
      </form>
    </div>
  );
}
