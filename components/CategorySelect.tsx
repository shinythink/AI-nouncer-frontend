"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types/analysis";
import { fetchCategories } from "@/lib/api";

interface Props {
  onSelect: (category: Category) => void;
  onBack: () => void;
}

export default function CategorySelect({ onSelect, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">타임어택 모드</h1>
        <p className="text-gray-500 text-sm">연습할 발음 카테고리를 고르세요</p>
        <p className="text-gray-400 text-xs mt-1">한국인이 자주 틀리는 발음 9가지</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">발음 카테고리를 불러오지 못했습니다.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            disabled={c.sentence_count === 0}
            className="flex flex-col gap-1 text-left bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 transition-colors hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-sm font-bold text-gray-800">{c.label}</span>
            <span className="text-[11px] text-gray-500 leading-snug">{c.blurb}</span>
            <span className="text-[10px] font-semibold text-amber-600 mt-0.5">
              {c.sentence_count}문장
            </span>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
        ← 모드 선택으로
      </button>
    </div>
  );
}
