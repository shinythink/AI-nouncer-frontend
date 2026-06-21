import { AnalysisResponse, Sentence } from "@/types/analysis";

// 정확도 모드 발음 훈련 루프: 결과를 바탕으로 "더 연습할" 다음 문장을 추천한다.
// 결정적(LLM 없음). 백엔드가 돌려준 weak_categories(검출된 약점)와 방금 읽은 문장의
// 카테고리만으로 후보를 고른다.

const MAX_RECOMMENDATIONS = 3;
const ACE_SCORE = 90; // 이 이상이고 검출 약점도 없으면 "에이스" → 진급 추천

export function recommendNext(
  current: Sentence,
  result: AnalysisResponse,
  all: Sentence[]
): Sentence[] {
  // 정렬 붕괴(채점 보류)면 새 문장 추천 없이 재도전을 유도한다.
  if (!result.reliable) return [];

  const aced =
    result.score != null &&
    result.score >= ACE_SCORE &&
    result.weak_categories.length === 0;

  const pool = all.filter((s) => s.id !== current.id);

  if (aced) {
    // 진급: 같은 카테고리에서 더 높은(또는 같은) 난이도로
    return pool
      .filter((s) => s.categories.some((c) => current.categories.includes(c)))
      .filter((s) => s.difficulty >= current.difficulty)
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, MAX_RECOMMENDATIONS);
  }

  // 보강: 검출된 약점 카테고리(없으면 방금 문장의 카테고리)를 공유하는 문장,
  // 현재 난이도에 가까운 순으로.
  const weak =
    result.weak_categories.length > 0 ? result.weak_categories : current.categories;

  return pool
    .filter((s) => s.categories.some((c) => weak.includes(c)))
    .sort(
      (a, b) =>
        Math.abs(a.difficulty - current.difficulty) -
          Math.abs(b.difficulty - current.difficulty) ||
        a.difficulty - b.difficulty
    )
    .slice(0, MAX_RECOMMENDATIONS);
}
