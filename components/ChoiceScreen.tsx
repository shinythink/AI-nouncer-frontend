"use client";

import { GameMode } from "@/types/analysis";

type LoadingKind = "original" | "all" | null;

interface Props {
  sentence: string;
  mode: GameMode;
  loading: LoadingKind;
  onOriginal: () => void;
  onAll: () => void;
  onBack: () => void;
}

const PRIMARY_LABEL: Record<GameMode, { title: string; sub: string }> = {
  accuracy: { title: "도전 결과 보기", sub: "정확도 채점" },
  timeattack: { title: "타임어택 결과 보기", sub: "정확도 × 속도 보너스" },
};

export default function ChoiceScreen({
  sentence,
  mode,
  loading,
  onOriginal,
  onAll,
  onBack,
}: Props) {
  const disabled = loading !== null;
  const primary = PRIMARY_LABEL[mode];

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">읽은 문장</p>
        <p className="text-2xl font-semibold text-gray-800 leading-relaxed">{sentence}</p>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">어떤 분석 결과를 보시겠어요?</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onOriginal}
          disabled={disabled}
          className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-5 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left">
            <p className="text-base font-semibold text-gray-800">{primary.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{primary.sub}</p>
          </div>
          {loading === "original" ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400">→</span>
          )}
        </button>

        <button
          onClick={onAll}
          disabled={disabled}
          className="flex items-center justify-between bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl px-5 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left">
            <p className="text-base font-semibold text-gray-800">모든 API 결과</p>
            <p className="text-xs text-gray-500 mt-0.5">
              analyze · full · preprocess · prompt · silence-only
            </p>
          </div>
          {loading === "all" ? (
            <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400">→</span>
          )}
        </button>
      </div>

      <button
        onClick={onBack}
        disabled={disabled}
        className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        ← 다시 녹음
      </button>
    </div>
  );
}
