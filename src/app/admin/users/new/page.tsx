import Link from "next/link";
import { createUser } from "../actions";
import { SubmitButton } from "../../new/submit-button";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Add user
        </h1>
        <Link href="/admin/users" className="btn btn-ghost text-sm">
          Cancel
        </Link>
      </div>

      {params.error && (
        <p className="mt-4 rounded-xl bg-[#fbece7] px-3 py-2 text-sm text-[#b0472e]">
          {params.error}
        </p>
      )}

      <form action={createUser} className="card mt-6 space-y-5 p-6">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="field" placeholder="person@company.com" />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input name="password" type="text" required minLength={6} className="field" />
          <p className="hint mt-1">
            At least 6 characters. Share it with the employee; they can change it later.
          </p>
        </div>
        <div>
          <label className="label">Role</label>
          <select name="role" className="field">
            <option value="employee">Employee</option>
            <option value="admin">Admin (can manage bots &amp; users)</option>
          </select>
        </div>
        <div>
          <label className="label">Team</label>
          <input name="team" placeholder="e.g. Accounting" className="field" />
          <p className="hint mt-1">
            The employee will only see their team&apos;s chatbots. Created automatically if new.
          </p>
        </div>
        <SubmitButton idle="Create user" pendingLabel="Creating…" />
      </form>
    </div>
  );
}
