export interface Sentence {
  id: string;
  text: string;
  // --- 스테이지 메타데이터 (STEP 3) ---
  difficulty: number; // 1~5
  target_pattern: string; // "ㅅ계열" | "종성" | "혼합" (레거시 뱃지)
  // --- 발음 카테고리 (다중 태깅) ---
  categories: string[]; // categories.json 의 id 목록
}

// 한국인이 자주 틀리는 발음 카테고리 (GET /api/v1/categories)
export interface Category {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  detect_labels?: string[];
  sentence_count: number;
}

export type GameMode = "accuracy" | "timeattack";

export interface User {
  id: number | null;
  name: string;
  email?: string | null;
  picture?: string | null;
}

export interface PendingProfile {
  name: string;
  email?: string | null;
  picture?: string | null;
}

export type AuthStatus =
  | { status: "anonymous" }
  | { status: "pending"; profile: PendingProfile }
  | { status: "authenticated"; user: User };

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  sentence_id: string;
  mode: string;
  grade?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

export interface ScoreSubmission {
  nickname: string;
  score: number;
  sentence_id: string;
  mode: GameMode;
  grade?: string | null;
  duration_ms?: number | null;
}

export interface AlignmentItem {
  expected: string;
  heard: string;
  type: string; // "match" | "ㅅ 계열 불명확" | "종성 약화" | "sub" | "ins" | "del"
}

export interface Candidate {
  index: number;
  expected: string;
  heard: string;
  type: string;
}

export interface Advice {
  focus: string;
  drills: string[];
  next_sentence?: string;
}

export type Verdict = "good" | "warn" | "bad";
export type Grade = "S" | "A" | "B" | "C" | "D";

export interface SyllableJudgment {
  expected: string;
  heard: string;
  verdict: Verdict;
  score: number; // 0~100 자모 부분 점수
}

export interface AnalysisResponse {
  transcript: string;
  alignment: AlignmentItem[];
  candidates: Candidate[];
  advice: Advice;

  // --- 게임화 필드 (STEP 1 백엔드에서 추가) ---
  // reliable=false 면 정렬 붕괴(STT 환각 가능성)로 채점 보류 → score/grade 는 null.
  score: number | null;
  grade: Grade | null;
  max_combo: number;
  reliable: boolean;
  syllable_judgments: SyllableJudgment[];

  // --- 발음 훈련 루프 ---
  // 이번 라운드에서 약하게 검출된 발음 카테고리 id. 정확도 모드 "더 연습하기"에 사용.
  weak_categories: string[];
}
