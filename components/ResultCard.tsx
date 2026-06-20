"use client";

import { useMemo } from "react";
import { AnalysisResponse, GameMode, Grade, SyllableJudgment, Verdict } from "@/types/analysis";

interface Props {
  sentence: string;
  result: AnalysisResponse;
  onRetry: () => void;
  onNew: () => void;
  mode?: GameMode;
  durationMs?: number;
  syllableCount?: number;
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
}: Props) {
  const { reliable, score, grade, max_combo, syllable_judgments, advice } = result;

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

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">🎙️</span>
          <p className="text-lg font-bold text-amber-900">음성 인식이 불안정해요. 다시 도전!</p>
          <p className="text-sm text-amber-700">
            녹음이 또렷하지 않아 점수를 매기지 않았어요. 조용한 곳에서 다시 한 번 읽어보세요.
          </p>
          {result.transcript && (
            <p className="text-xs text-amber-600/80 mt-1">인식된 음성: “{result.transcript}”</p>
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

  const isBoss = mode === "boss";
  const cleared = score != null && score >= 75; // 보스전 클리어 기준(B 이상)

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

      {/* 보스전: AI 코치 코멘트를 전면에 (보스전에서만 LLM 호출됨) */}
      {isBoss && advice?.focus ? (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col gap-3 animate-badge-in">
          <p className="text-sm font-bold text-purple-800">
            {cleared ? "👑 보스 인정! 코치의 한마디" : "👑 보스의 한마디"}
          </p>
          <p className="text-base text-purple-900">{advice.focus}</p>
          {advice.drills?.length > 0 && (
            <ul className="flex flex-col gap-1">
              {advice.drills.map((d, i) => (
                <li key={i} className="text-sm text-purple-800/90 flex gap-1.5">
                  <span className="text-purple-400 font-bold">·</span>
                  {d}
                </li>
              ))}
            </ul>
          )}
          {advice.next_sentence && (
            <div className="bg-white/70 border border-purple-200 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-purple-400 mb-0.5">다음 추천 문장</p>
              <p className="text-sm font-semibold text-purple-900">{advice.next_sentence}</p>
            </div>
          )}
        </div>
      ) : (
        advice?.focus && (
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
        )
      )}

      <ActionButtons onRetry={onRetry} onNew={onNew} />
    </div>
  );
}
