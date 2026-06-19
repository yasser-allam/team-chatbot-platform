// Document ingestion helpers — SERVER ONLY.
// Turn an uploaded file (or pasted text) into clean text, split it into chunks,
// and create a Gemini embedding (768 numbers) for each chunk.
import { genai, EMBEDDING_MODEL } from "@/lib/gemini";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

// --- 1. Any supported file -> plain text ---
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
  // .txt, .md, and anything else: read as UTF-8 text
  return buf.toString("utf-8");
}

// --- 2. Long text -> overlapping chunks (~1000 chars, 150 overlap) ---
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

// --- 3. One chunk -> its embedding vector ---
export async function embedText(text: string): Promise<number[]> {
  const res = await genai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  const values = res.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini returned no embedding");
  }
  return values;
}
