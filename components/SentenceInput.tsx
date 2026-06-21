"use client";

import { useMemo } from "react";
import { GameMode, Sentence } from "@/types/analysis";

interface Props {
  sentences: Sentence[];
  mode: GameMode;
  onSelect: (sentence: Sentence) => void;
  onBack: () => void;
  // 타임어택: 카테고리 우선 선택에서 넘어온 필터
  category?: string;
  categoryLabel?: string;
}

const PATTERN_STYLE: Record<string, string> = {
  ㅅ계열: "bg-sky-100 text-sky-700",
  종성: "bg-violet-100 text-violet-700",
  혼합: "bg-gray-100 text-gray-600",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-xs tracking-tight" title={`난이도 ${n}/5`}>
      <span className="text-amber-500">{"★".repeat(n)}</span>
      <span className="text-gray-300">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

const MODE_LABEL: Record<GameMode, string> = {
  accuracy: "정확도 모드",
  timeattack: "타임어택 모드",
};

export default function SentenceInput({
  sentences,
  mode,
  onSelect,
  onBack,
  category,
  categoryLabel,
}: Props) {
  // 카테고리 필터(타임어택) → 난이도 오름차순 정렬.
  const stages = useMemo(() => {
    const pool = category ? sentences.filter((s) => s.categories.includes(category)) : sentences;
    return [...pool].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
  }, [sentences, category]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{MODE_LABEL[mode]}</h1>
        {categoryLabel ? (
          <p className="text-gray-500 text-sm">
            <span className="font-semibold text-amber-600">{categoryLabel}</span> 문장을 골라 도전하세요
          </p>
        ) : (
          <p className="text-gray-500 text-sm">스테이지를 골라 도전하세요 (난이도 낮은 순)</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="flex items-center gap-4 text-left bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 transition-colors group hover:bg-blue-50 hover:border-blue-300"
          >
            <span className="text-xs font-bold text-gray-400 w-6 shrink-0">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-base text-gray-800">{s.text}</span>
              <span className="flex items-center gap-2">
                <Stars n={s.difficulty} />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PATTERN_STYLE[s.target_pattern] ?? PATTERN_STYLE["혼합"]}`}>
                  {s.target_pattern}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
        {category ? "← 카테고리 선택으로" : "← 모드 선택으로"}
      </button>
    </div>
  );
}
