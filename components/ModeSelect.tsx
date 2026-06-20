"use client";

import { GameMode } from "@/types/analysis";

interface Props {
  onSelect: (mode: GameMode) => void;
}

const MODES: { key: GameMode; emoji: string; title: string; desc: string; accent: string }[] = [
  {
    key: "accuracy",
    emoji: "🎯",
    title: "정확도 모드",
    desc: "발음 정확도만으로 점수·등급·콤보를 겨룹니다.",
    accent: "hover:bg-blue-50 hover:border-blue-300",
  },
  {
    key: "timeattack",
    emoji: "⚡",
    title: "타임어택 모드",
    desc: "빠르고 또렷하게! 발음 점수 × 속도 보너스로 최종 점수.",
    accent: "hover:bg-amber-50 hover:border-amber-300",
  },
  {
    key: "boss",
    emoji: "👑",
    title: "보스전 모드",
    desc: "최고 난이도 문장에 도전. 클리어하면 AI 코치의 인정 코멘트.",
    accent: "hover:bg-purple-50 hover:border-purple-300",
  },
];

export default function ModeSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-nouncer</h1>
        <p className="text-gray-500 text-sm">한국어 발음 챌린지 — 모드를 골라 시작하세요</p>
      </div>

      <div className="flex flex-col gap-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`flex items-center gap-4 text-left bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 transition-colors ${m.accent}`}
          >
            <span className="text-3xl shrink-0">{m.emoji}</span>
            <div>
              <p className="text-base font-bold text-gray-800">{m.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
