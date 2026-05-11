import { AnalysisResponse, Sentence } from "@/types/analysis";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function fetchSentences(): Promise<Sentence[]> {
  const res = await fetch(`${BACKEND}/api/v1/sentences`);
  if (!res.ok) throw new Error("문장 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function analyzeFree(
  audioBlob: Blob,
  sentenceText: string
): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "audio.webm");
  form.append("sentence_text", sentenceText);

  const res = await fetch(`${BACKEND}/api/v1/analyze/free`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

export const ANALYZE_VARIANTS = [
  { key: "default", label: "기본 (analyze)", path: "/api/v1/analyze" },
  { key: "full", label: "Full", path: "/api/v1/analyze/full" },
  { key: "preprocess", label: "Preprocess", path: "/api/v1/analyze/preprocess" },
  { key: "prompt", label: "Prompt", path: "/api/v1/analyze/prompt" },
  { key: "silence-only", label: "Silence Only", path: "/api/v1/analyze/silence-only" },
] as const;

export type AnalyzeVariantKey = (typeof ANALYZE_VARIANTS)[number]["key"];

export async function analyzeById(
  audioBlob: Blob,
  sentenceId: string,
  path: string
): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "audio.webm");
  form.append("sentence_id", sentenceId);

  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
