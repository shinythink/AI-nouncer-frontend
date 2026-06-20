"use client";

import { useMemo } from "react";
import { GameMode, Sentence } from "@/types/analysis";

interface Props {
  sentences: Sentence[];
  mode: GameMode;
  onSelect: (sentence: Sentence) => void;
  onBack: () => void;
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
  boss: "보스전 모드",
};

export default function SentenceInput({ sentences, mode, onSelect, onBack }: Props) {
  // 난이도 오름차순 스테이지 정렬. 보스전이면 최고 난이도 문장만 노출.
  const stages = useMemo(() => {
    const sorted = [...sentences].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
    if (mode !== "boss") return sorted;
    const maxDiff = Math.max(...sentences.map((s) => s.difficulty), 0);
    return sorted.filter((s) => s.difficulty === maxDiff);
  }, [sentences, mode]);

  const isBoss = mode === "boss";

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{MODE_LABEL[mode]}</h1>
        <p className="text-gray-500 text-sm">
          {isBoss ? "최고 난이도 보스 문장에 도전하세요" : "스테이지를 골라 도전하세요 (난이도 낮은 순)"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`flex items-center gap-4 text-left border rounded-xl px-5 py-4 transition-colors group ${
              isBoss
                ? "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300"
                : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
            }`}
          >
            <span className="text-xs font-bold text-gray-400 w-6 shrink-0">
              {isBoss ? "👑" : `${i + 1}`}
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
        ← 모드 선택으로
      </button>
    </div>
  );
}
