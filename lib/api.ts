import {
  AnalysisResponse,
  AuthStatus,
  Category,
  LeaderboardEntry,
  ScoreSubmission,
  Sentence,
  User,
} from "@/types/analysis";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// 쿠키 세션을 쓰므로 백엔드 호출엔 자격 증명(쿠키)을 항상 포함한다.
const CREDS: RequestInit = { credentials: "include" };

export async function fetchSentences(): Promise<Sentence[]> {
  const res = await fetch(`${BACKEND}/api/v1/sentences`, CREDS);
  if (!res.ok) throw new Error("문장 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BACKEND}/api/v1/categories`, CREDS);
  if (!res.ok) throw new Error("발음 카테고리를 불러오지 못했습니다.");
  return res.json();
}

// --- 인증(Google OAuth + 쿠키 세션) ---
export function loginUrl(): string {
  return `${BACKEND}/api/v1/auth/login`;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/status`, CREDS);
    if (!res.ok) return { status: "anonymous" };
    return res.json();
  } catch {
    return { status: "anonymous" };
  }
}

export async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/me`, CREDS);
    if (!res.ok) return null; // 401 = 비로그인
    return res.json();
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch(`${BACKEND}/api/v1/auth/logout`, { method: "POST", ...CREDS });
}

export async function checkNickname(
  nickname: string
): Promise<{ available: boolean; reason?: string }> {
  const q = new URLSearchParams({ nickname });
  const res = await fetch(`${BACKEND}/api/v1/auth/nickname/check?${q.toString()}`, CREDS);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createAccount(nickname: string): Promise<User> {
  const res = await fetch(`${BACKEND}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
    ...CREDS,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }

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
    ...CREDS,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function submitScore(sub: ScoreSubmission): Promise<LeaderboardEntry> {
  const res = await fetch(`${BACKEND}/api/v1/leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
    ...CREDS,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchLeaderboard(params: {
  mode?: string;
  sentence_id?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams();
  if (params.mode) q.set("mode", params.mode);
  if (params.sentence_id) q.set("sentence_id", params.sentence_id);
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(`${BACKEND}/api/v1/leaderboard?${q.toString()}`, CREDS);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    ...CREDS,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
