"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
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
  if (profile?.role !== "admin") throw new Error("Not authorized");
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "employee");
  const teamName = String(formData.get("team") || "").trim();

  if (!email || password.length < 6) {
    redirect(
      "/admin/users/new?error=" +
        encodeURIComponent("Email and a password of at least 6 characters are required.")
    );
  }

  // Find or create the team (optional).
  let teamId: string | null = null;
  if (teamName) {
    const { data: existing } = await admin
      .from("teams")
      .select("id")
      .eq("name", teamName)
      .maybeSingle();
    if (existing) {
      teamId = existing.id;
    } else {
      const { data: nt } = await admin
        .from("teams")
        .insert({ name: teamName })
        .select("id")
        .single();
      teamId = nt?.id ?? null;
    }
  }

  // Create the auth user (email pre-confirmed so no confirmation email needed).
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    redirect(
      "/admin/users/new?error=" +
        encodeURIComponent(error?.message || "Could not create user.")
    );
  }

  // The DB trigger created a profile row; set its role + team.
  await admin
    .from("profiles")
    .update({ role, team_id: teamId })
    .eq("id", created!.user.id);

  redirect("/admin/users");
}
