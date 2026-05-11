"use client";

import { AnalysisResponse } from "@/types/analysis";
import ResultBody from "./ResultBody";

interface Props {
  sentence: string;
  result: AnalysisResponse;
  onRetry: () => void;
  onNew: () => void;
}

export default function ResultCard({ sentence, result, onRetry, onNew }: Props) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">원문</p>
        <p className="text-lg font-semibold text-gray-700">{sentence}</p>
      </div>

      <ResultBody result={result} />

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          다시 녹음
        </button>
        <button
          onClick={onNew}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          새 문장
        </button>
      </div>
    </div>
  );
}
