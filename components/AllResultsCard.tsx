"use client";

import { useState } from "react";
import { AnalysisResponse } from "@/types/analysis";
import ResultBody from "./ResultBody";

export interface VariantResult {
  key: string;
  label: string;
  path: string;
  data: AnalysisResponse | null;
  error: string | null;
}

interface Props {
  sentence: string;
  results: VariantResult[];
  onRetry: () => void;
  onNew: () => void;
}

export default function AllResultsCard({ sentence, results, onRetry, onNew }: Props) {
  const firstSuccess = results.find((r) => r.data)?.key ?? results[0]?.key ?? "";
  const [activeKey, setActiveKey] = useState<string>(firstSuccess);
  const active = results.find((r) => r.key === activeKey);

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">원문</p>
        <p className="text-lg font-semibold text-gray-700">{sentence}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {results.map((r) => {
          const isActive = r.key === activeKey;
          const failed = r.error !== null;
          return (
            <button
              key={r.key}
              onClick={() => setActiveKey(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : failed
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {r.label}
              {failed && <span className="ml-1">⚠</span>}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-xs font-semibold text-gray-700">{active.label}</span>
            <span className="text-xs text-gray-400 font-mono">{active.path}</span>
          </div>

          {active.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <p className="font-semibold mb-1">요청 실패</p>
              <p className="break-words">{active.error}</p>
            </div>
          ) : active.data ? (
            <ResultBody result={active.data} />
          ) : (
            <p className="text-sm text-gray-500">결과 없음</p>
          )}
        </div>
      )}

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
