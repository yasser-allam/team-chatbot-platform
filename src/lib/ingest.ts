import type { SupabaseClient } from "@supabase/supabase-js";
import { genai, EMBEDDING_MODEL, EMBEDDING_DIMS } from "@/lib/gemini";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  return buf.toString("utf-8");
}

export function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

export async function embedText(text: string): Promise<number[]> {
  const res = await genai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMS },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini returned no embedding");
  }
  return values;
}

// Ingest uploaded files + pasted text into an existing bot: extract text,
// chunk, embed, and store, creating one `documents` row per source (status
// processing -> ready | error). Shared by "create bot" and "add documents".
export async function ingestToBot(
  admin: SupabaseClient,
  chatbotId: string,
  files: File[],
  pasted: string
): Promise<{ totalChunks: number; firstError: string | null; sourceCount: number }> {
  const sources: { fileName: string; text: string }[] = [];
  for (const f of files) {
    try {
      sources.push({ fileName: f.name, text: await fileToText(f) });
    } catch {
      await admin
        .from("documents")
        .insert({ chatbot_id: chatbotId, file_name: f.name, status: "error" });
    }
  }
  if (pasted) sources.push({ fileName: "Pasted text", text: pasted });

  let totalChunks = 0;
  let firstError: string | null = null;

  for (const src of sources) {
    const { data: doc } = await admin
      .from("documents")
      .insert({ chatbot_id: chatbotId, file_name: src.fileName, status: "processing" })
      .select("id")
      .single();

    try {
      const chunks = chunkText(src.text);
      for (const chunk of chunks) {
        const embedding = await embedText(chunk);
        const { error: insErr } = await admin.from("chunks").insert({
          chatbot_id: chatbotId,
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

  return { totalChunks, firstError, sourceCount: sources.length };
}
