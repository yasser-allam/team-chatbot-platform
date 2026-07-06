import { login } from "./actions";
import { LeafMark } from "@/components/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rise">
        <div className="mb-6 flex flex-col items-center text-center">
          <LeafMark size={48} />
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
            Welcome to Sage
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your team&apos;s knowledge, one question away.
          </p>
        </div>

        <div className="card p-7">
          {params.error && (
            <p className="mb-4 rounded-xl bg-[#fbece7] px-3 py-2 text-sm text-[#b0472e]">
              {params.error}
            </p>
          )}
          {params.message && (
            <p className="mb-4 rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700">
              {params.message}
            </p>
          )}
          <form className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="field" placeholder="you@company.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required className="field" placeholder="••••••••" />
            </div>
            <button formAction={login} className="btn btn-primary w-full">
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-ink-soft">
          Accounts are created by your administrator.
          <br />
          Contact them if you can&apos;t sign in.
        </p>
      </div>
    </main>
  );
}
