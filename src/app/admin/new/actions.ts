"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileToText, chunkText, embedText } from "@/lib/ingest";

export async function createChatbot(formData: FormData) {
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
    throw new Error("Not authorized");
  }

  const admin = createAdminClient();

  const name = String(formData.get("name") || "").trim();
  const teamName = String(formData.get("team") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim() || null;
  if (!name || !teamName) {
    redirect("/admin/new?error=" + encodeURIComponent("Name and team are required."));
  }

  let teamId: string;
  const { data: existingTeam } = await admin
    .from("teams")
    .select("id")
    .eq("name", teamName)
    .maybeSingle();
  if (existingTeam) {
    teamId = existingTeam.id;
  } else {
    const { data: newTeam, error } = await admin
      .from("teams")
      .insert({ name: teamName })
      .select("id")
      .single();
    if (error || !newTeam) throw new Error("Could not create team");
    teamId = newTeam.id;
  }

  const { data: bot, error: botErr } = await admin
    .from("chatbots")
    .insert({ name, team_id: teamId, instructions })
    .select("id")
    .single();
  if (botErr || !bot) throw new Error("Could not create chatbot");

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const pasted = String(formData.get("pasted") || "").trim();

  const sources: { fileName: string; text: string }[] = [];
  for (const f of files) {
    try {
      sources.push({ fileName: f.name, text: await fileToText(f) });
    } catch {
      await admin
        .from("documents")
        .insert({ chatbot_id: bot.id, file_name: f.name, status: "error" });
    }
  }
  if (pasted) sources.push({ fileName: "Pasted text", text: pasted });

  let totalChunks = 0;
  let firstError: string | null = null;

  for (const src of sources) {
    const { data: doc } = await admin
      .from("documents")
      .insert({ chatbot_id: bot.id, file_name: src.fileName, status: "processing" })
      .select("id")
      .single();

    try {
      const chunks = chunkText(src.text);
      for (const chunk of chunks) {
        const embedding = await embedText(chunk);
        const { error: insErr } = await admin.from("chunks").insert({
          chatbot_id: bot.id,
          document_id: doc?.id ?? null,
          content: chunk,
          embedding: JSON.stringify(embedding),
        });
        if (insErr) throw new Error("DB insert failed: " + insErr.message);
        totalChunks++;
      }
      if (doc) {
        await admin.from("documents").update({ status: "ready" }).eq("id", doc.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      firstError = firstError ?? msg;
      console.error("[ingest] failed for", src.fileName, "-", msg);
      if (doc) {
        await admin.from("documents").update({ status: "error" }).eq("id", doc.id);
      }
    }
  }

  if (sources.length > 0 && totalChunks === 0 && firstError) {
    redirect(
      "/admin/new?error=" +
        encodeURIComponent("Document processing failed: " + firstError)
    );
  }

  redirect("/admin");
}
