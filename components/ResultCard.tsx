"use client";

import { useMemo } from "react";
import { AnalysisResponse, GameMode, Grade, Sentence, SyllableJudgment, User, Verdict } from "@/types/analysis";
import { recommendNext } from "@/lib/recommend";
import Leaderboard from "./Leaderboard";

interface Props {
  sentence: string;
  result: AnalysisResponse;
  onRetry: () => void;
  onNew: () => void;
  mode?: GameMode;
  durationMs?: number;
  syllableCount?: number;
  sentenceId?: string;
  user?: User | null;
  // 발음 훈련 루프(정확도 모드): 방금 읽은 문장 + 전체 문장 풀 + 추천 클릭 핸들러
  current?: Sentence;
  sentences?: Sentence[];
  onPractice?: (sentence: Sentence) => void;
}

const STAGGER_MS = 70; // 칩 순차 등장 간격
const COMBO_MIN = 3; // 이 길이 이상의 연속 good 구간에만 콤보 팝업
const TARGET_MS_PER_SYL = 400; // 타임어택 목표 속도(음절당)

const GRADE_STYLE: Record<Grade, string> = {
  S: "bg-gradient-to-br from-amber-300 to-yellow-500 text-white ring-4 ring-amber-200 shadow-lg shadow-amber-200",
  A: "bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200",
  B: "bg-green-500 text-white ring-2 ring-green-200",
  C: "bg-gray-400 text-white",
  D: "bg-red-500 text-white",
};

const VERDICT_CHIP: Record<Verdict, string> = {
  good: "bg-green-100 text-green-800 border-green-300",
  warn: "bg-amber-100 text-amber-800 border-amber-300",
  bad: "bg-red-100 text-red-700 border-red-300",
};

function reasonLabel(j: SyllableJudgment): string | null {
  if (j.verdict === "warn") return "종성?";
  if (j.verdict === "bad") return j.heard ? `→${j.heard}` : "누락";
  return null;
}

function ActionButtons({ onRetry, onNew }: { onRetry: () => void; onNew: () => void }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onRetry}
        className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        다시 도전
      </button>
      <button
        onClick={onNew}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        다음 스테이지
      </button>
    </div>
  );
}

export default function ResultCard({
  sentence,
  result,
  onRetry,
  onNew,
  mode = "accuracy",
  durationMs = 0,
  syllableCount,
  sentenceId,
  user,
  current,
  sentences,
  onPractice,
}: Props) {
  const { reliable, score, grade, max_combo, syllable_judgments, advice } = result;

  // 정확도 모드 발음 훈련 루프: 부족했던 발음 위주로 다음 연습 문장 추천(결정적).
  const recommendations = useMemo(
    () =>
      mode === "accuracy" && current && sentences && onPractice
        ? recommendNext(current, result, sentences)
        : [],
    [mode, current, sentences, onPractice, result]
  );

  const comboEnds = useMemo(() => {
    const ends: Record<number, number> = {};
    let run = 0;
    syllable_judgments.forEach((j, i) => {
      if (j.verdict === "good") {
        run += 1;
      } else {
        if (run >= COMBO_MIN) ends[i - 1] = run;
        run = 0;
      }
    });
    if (run >= COMBO_MIN) ends[syllable_judgments.length - 1] = run;
    return ends;
  }, [syllable_judgments]);

  // --- reliable=False: 점수 미반영, 재도전 유도 (타임어택 속도보너스도 무효) ---
  if (!reliable) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-lg">
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">원문</p>
          <p className="text-lg font-semibold text-gray-700">{sentence}</p>
        </div>

        <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 border border-fuchsia-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-6xl animate-badge-in">👾</span>
          <p className="text-lg font-black text-fuchsia-900">방해꾼이 끼어들었다!</p>
          <p className="text-sm text-fuchsia-700">
            잡음 요정이 네 목소리를 가로채 엉뚱한 말로 바꿔버렸어. 점수는 무효!
            <br />
            다시 또렷하게 외쳐서 방해꾼을 물리치자.
          </p>
          {result.transcript && (
            <p className="text-xs text-fuchsia-500/80 mt-1 italic">
              방해꾼이 흘린 말: “{result.transcript}”
            </p>
          )}
        </div>

        <ActionButtons onRetry={onRetry} onNew={onNew} />
      </div>
    );
  }

  // --- reliable=True ---
  const gradeKey = (grade ?? "D") as Grade;
  const chipsDone = syllable_judgments.length * STAGGER_MS;

  // 타임어택: 최종 점수 = 발음 점수 × 속도 보너스(목표시간/실제시간, 0.5~1.5 클램프)
  const sylCount = syllableCount ?? syllable_judgments.length;
  const timeAttack =
    mode === "timeattack" && durationMs > 0 && score != null && sylCount > 0
      ? (() => {
          const targetMs = sylCount * TARGET_MS_PER_SYL;
          const bonus = Math.min(1.5, Math.max(0.5, targetMs / durationMs));
          const finalScore = Math.max(0, Math.min(100, Math.round(score * bonus)));
          return { bonus, finalScore, targetMs };
        })()
      : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">원문</p>
        <p className="text-base font-semibold text-gray-600">{sentence}</p>
      </div>

      {/* 헤더: 등급 배지 + 점수 + MAX COMBO */}
      <div className="flex items-center justify-center gap-6">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black animate-badge-in ${GRADE_STYLE[gradeKey]}`}
        >
          {gradeKey}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-800 tabular-nums">{score}</span>
            <span className="text-lg text-gray-400 font-semibold">/100</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 w-fit">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-bold text-orange-700 tabular-nums">MAX COMBO {max_combo}</span>
          </div>
        </div>
      </div>

      {/* 타임어택: 속도 보너스 + 최종 점수 */}
      {timeAttack && (
        <div className="flex items-center justify-around bg-amber-50 border border-amber-200 rounded-xl p-3 text-center animate-badge-in">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-amber-500">녹음 시간</p>
            <p className="text-sm font-bold text-amber-800 tabular-nums">{(durationMs / 1000).toFixed(1)}초</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-amber-500">속도 보너스</p>
            <p className="text-sm font-bold text-amber-800 tabular-nums">×{timeAttack.bonus.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-orange-500">최종 점수</p>
            <p className="text-lg font-black text-orange-700 tabular-nums">{timeAttack.finalScore}</p>
          </div>
        </div>
      )}

      {/* 음절 칩 그리드 */}
      {syllable_judgments.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">음절 판정</p>
          <div className="flex flex-wrap gap-1.5">
            {syllable_judgments.map((j, i) => {
              const reason = reasonLabel(j);
              const combo = comboEnds[i];
              return (
                <span
                  key={i}
                  style={{ animationDelay: `${i * STAGGER_MS}ms` }}
                  className={`relative inline-flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-base font-semibold animate-chip-in ${VERDICT_CHIP[j.verdict]}`}
                  title={`${j.expected}${j.heard && j.heard !== j.expected ? ` → ${j.heard}` : ""} (${j.score})`}
                >
                  {combo && (
                    <span
                      style={{ animationDelay: `${i * STAGGER_MS + 120}ms` }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow animate-combo-pop"
                    >
                      COMBO x{combo}
                    </span>
                  )}
                  {j.expected}
                  {reason && <span className="text-[10px] leading-none mt-0.5 opacity-70">{reason}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {advice?.focus && (
        <details
          className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 animate-chip-in"
          style={{ animationDelay: `${chipsDone + 100}ms` }}
        >
          <summary className="text-sm font-semibold text-blue-800 cursor-pointer select-none">
            코칭 한마디 보기
          </summary>
          <p className="text-sm text-blue-900 mt-2">{advice.focus}</p>
          {advice.drills?.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {advice.drills.map((d, i) => (
                <li key={i} className="text-sm text-blue-800/90 flex gap-1.5">
                  <span className="text-blue-400 font-bold">·</span>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </details>
      )}

      {/* 발음 훈련 루프(정확도 모드): 부족했던 발음 위주로 다음 연습 문장 추천 */}
      {onPractice && recommendations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-2 animate-badge-in">
          <p className="text-sm font-bold text-emerald-800">🎯 이 발음 더 연습하기</p>
          <p className="text-xs text-emerald-700/80">
            부족했던 발음 위주로 골랐어요. 문장을 눌러 바로 이어서 연습하세요.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {recommendations.map((s) => (
              <button
                key={s.id}
                onClick={() => onPractice(s)}
                className="flex items-center justify-between gap-3 text-left bg-white border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-100 transition-colors"
              >
                <span className="text-sm text-gray-800">{s.text}</span>
                <span className="text-[11px] text-emerald-500 shrink-0">난이도 {s.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sentenceId && (
        <Leaderboard
          sentenceId={sentenceId}
          mode={mode}
          score={timeAttack ? timeAttack.finalScore : (score ?? 0)}
          grade={gradeKey}
          user={user}
          durationMs={mode === "timeattack" ? durationMs : undefined}
        />
      )}

      <ActionButtons onRetry={onRetry} onNew={onNew} />
    </div>
  );
}
