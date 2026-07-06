import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark, LeafMark } from "@/components/brand";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center rise">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-2xl">
            🔒
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Admins only
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            This area is for managers. Ask an administrator if you need access.
          </p>
          <Link href="/" className="btn btn-primary mt-5">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <LeafMark size={32} />
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Sage
              </span>
            </Link>
            <span className="chip">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="btn btn-ghost text-sm">
              Chatbots
            </Link>
            <Link href="/admin/users" className="btn btn-ghost text-sm">
              Users
            </Link>
            <Link href="/" className="btn btn-ghost text-sm">
              Exit
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
