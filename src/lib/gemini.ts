import { GoogleGenAI } from "@google/genai";
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export const CHAT_MODEL = "gemini-2.5-flash";
export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMS = 768;
