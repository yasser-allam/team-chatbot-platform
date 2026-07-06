"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestToBot } from "@/lib/ingest";

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

// Find a team by name or create it; returns its id.
async function findOrCreateTeam(
  admin: ReturnType<typeof createAdminClient>,
  teamName: string
): Promise<string | null> {
  const { data: existing } = await admin
    .from("teams")
    .select("id")
    .eq("name", teamName)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: nt } = await admin
    .from("teams")
    .insert({ name: teamName })
    .select("id")
    .single();
  return nt?.id ?? null;
}

export async function updateChatbot(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const botId = String(formData.get("botId") || "");
  const name = String(formData.get("name") || "").trim();
  const teamName = String(formData.get("team") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim() || null;

  if (!botId) throw new Error("Missing bot id");
  const base = "/admin/" + botId;
  if (!name || !teamName) {
    redirect(base + "?error=" + encodeURIComponent("Name and team are required."));
  }

  const teamId = await findOrCreateTeam(admin, teamName);
  if (!teamId) {
    redirect(base + "?error=" + encodeURIComponent("Could not set the team."));
  }

  const { error } = await admin
    .from("chatbots")
    .update({ name, team_id: teamId, instructions })
    .eq("id", botId);
  if (error) {
    redirect(base + "?error=" + encodeURIComponent("Could not save: " + error.message));
  }

  revalidatePath(base);
  revalidatePath("/admin");
  redirect(base + "?saved=1");
}

export async function deleteChatbot(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const botId = String(formData.get("botId") || "");
  if (!botId) throw new Error("Missing bot id");

  // documents + chunks cascade-delete via their foreign keys.
  const { error } = await admin.from("chatbots").delete().eq("id", botId);
  if (error) {
    redirect(
      "/admin/" + botId + "?error=" + encodeURIComponent("Could not delete: " + error.message)
    );
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function addDocuments(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const botId = String(formData.get("botId") || "");
  if (!botId) throw new Error("Missing bot id");
  const base = "/admin/" + botId;

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const pasted = String(formData.get("pasted") || "").trim();

  if (files.length === 0 && !pasted) {
    redirect(base + "?error=" + encodeURIComponent("Add a file or paste some text first."));
  }

  const { totalChunks, firstError, sourceCount } = await ingestToBot(
    admin,
    botId,
    files,
    pasted
  );

  revalidatePath(base);
  if (sourceCount > 0 && totalChunks === 0 && firstError) {
    redirect(base + "?error=" + encodeURIComponent("Document processing failed: " + firstError));
  }
  redirect(base + "?saved=1");
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const botId = String(formData.get("botId") || "");
  const documentId = String(formData.get("documentId") || "");
  if (!botId || !documentId) throw new Error("Missing id");

  // chunks cascade-delete via their document_id foreign key.
  const { error } = await admin.from("documents").delete().eq("id", documentId);
  if (error) {
    redirect(
      "/admin/" + botId + "?error=" + encodeURIComponent("Could not remove document: " + error.message)
    );
  }

  revalidatePath("/admin/" + botId);
  redirect("/admin/" + botId + "?saved=1");
}
