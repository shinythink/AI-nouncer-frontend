export interface Sentence {
  id: string;
  text: string;
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
}
