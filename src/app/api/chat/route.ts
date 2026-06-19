import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ingest";
import { genai, CHAT_MODEL } from "@/lib/gemini";

type Match = { id: string; content: string; similarity: number };

// PostgREST sometimes types a to-one relation as an array; normalise it.
function relName(rel: unknown): string | undefined {
  if (!rel) return undefined;
  const obj = Array.isArray(rel) ? rel[0] : rel;
  return (obj as { name?: string; file_name?: string } | undefined)?.name
    ?? (obj as { name?: string; file_name?: string } | undefined)?.file_name;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const chatbotId = body?.chatbotId as string | undefined;
  const message = (body?.message as string | undefined)?.trim();
  if (!chatbotId || !message) {
    return NextResponse.json({ error: "Missing chatbotId or message" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: bot } = await admin
    .from("chatbots")
    .select("name, instructions, teams(name)")
    .eq("id", chatbotId)
    .single();
  if (!bot) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

  // 1. Embed the question and find the closest chunks FOR THIS BOT ONLY.
  let matches: Match[] = [];
  try {
    const embedding = await embedText(message);
    const { data, error } = await admin.rpc("match_chunks", {
      query_embedding: JSON.stringify(embedding),
      match_chatbot_id: chatbotId,
      match_count: 5,
    });
    if (error) throw new Error(error.message);
    matches = (data ?? []) as Match[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Search failed: " + msg }, { status: 500 });
  }

  const context = matches.map((m, i) => `[${i + 1}] ${m.content}`).join("\n\n");

  // 2. Find which document(s) the matched chunks came from.
  let sources: string[] = [];
  if (matches.length) {
    const { data: rows } = await admin
      .from("chunks")
      .select("documents(file_name)")
      .in("id", matches.map((m) => m.id));
    const names = (rows ?? [])
      .map((r) => relName((r as { documents: unknown }).documents))
      .filter((n): n is string => Boolean(n));
    sources = Array.from(new Set(names));
  }

  // 3. Ask Gemini to answer using only that context.
  const teamName = relName((bot as { teams: unknown }).teams) ?? "the company";
  const instructions = (bot as { instructions: string | null }).instructions;
  const botName = (bot as { name: string }).name;
  const system = [
    `You are "${botName}", a helpful assistant for the ${teamName} team.`,
    `Answer the question using ONLY the context below, taken from the company's internal documents.`,
    `If the answer is not in the context, say you don't have that information and suggest checking with a manager. Never invent facts.`,
    instructions ? `Extra instructions: ${instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Context from company documents:\n${context || "(no relevant documents found)"}\n\nQuestion: ${message}`;

  try {
    const res = await genai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: { systemInstruction: system, temperature: 0.2 },
    });
    const answer = res.text ?? "Sorry, I could not generate an answer.";
    return NextResponse.json({ answer, sources });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Answer failed: " + msg }, { status: 500 });
  }
}
