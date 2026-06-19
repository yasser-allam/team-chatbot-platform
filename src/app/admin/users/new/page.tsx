import Link from "next/link";
import { createUser } from "../actions";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Add user</h1>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">
          Cancel
        </Link>
      </div>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form action={createUser} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" type="email" required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Temporary password</label>
          <input name="password" type="text" required minLength={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none" />
          <p className="mt-1 text-xs text-gray-400">At least 6 characters. Share it with the employee; they can change it later.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none">
            <option value="employee">Employee</option>
            <option value="admin">Admin (can manage bots & users)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Team</label>
          <input name="team" placeholder="e.g. Accounting"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none" />
          <p className="mt-1 text-xs text-gray-400">The employee will only see their team&apos;s chatbots. Created automatically if new.</p>
        </div>
        <button type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Create user
        </button>
      </form>
    </div>
  );
}
