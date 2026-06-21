"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, submitScore } from "@/lib/api";
import { GameMode, LeaderboardEntry, User } from "@/types/analysis";

interface Props {
  sentenceId: string;
  mode: GameMode;
  score: number; // 등록할 최종 점수 (타임어택은 보너스 반영 점수)
  grade?: string | null;
  user?: User | null;
  durationMs?: number; // 타임어택 기록용(선택)
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ sentenceId, mode, score, grade, user, durationMs }: Props) {
  const [nickname, setNickname] = useState(user?.name ?? "");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 정보가 뒤늦게 들어오면(닉네임 미입력 상태에 한해) 계정 이름으로 채운다.
  useEffect(() => {
    if (user?.name) setNickname((prev) => prev || user.name);
  }, [user]);

  const load = useCallback(async () => {
    try {
      setEntries(await fetchLeaderboard({ mode, sentence_id: sentenceId, limit: 10 }));
    } catch {
      // 리더보드 조회 실패는 치명적이지 않음 — 조용히 빈 목록 유지
    }
  }, [mode, sentenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit() {
    const nick = nickname.trim();
    if (!nick || busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitScore({
        nickname: nick,
        score,
        sentence_id: sentenceId,
        mode,
        grade,
        duration_ms: durationMs,
      });
      setSubmitted(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "점수 등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {mode === "timeattack" ? "⚡ 타임어택 랭킹" : "랭킹"}
        </p>
        {user && !submitted && (
          <p className="text-[11px] text-gray-400">
            <span className="font-medium text-gray-500">{user.name}</span>(으)로 기록
          </p>
        )}
      </div>

      {!submitted ? (
        <div className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={20}
            placeholder="닉네임"
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleSubmit}
            disabled={busy || !nickname.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "등록 중…" : `점수 등록 (${score})`}
          </button>
        </div>
      ) : (
        <p className="text-sm text-green-600 font-medium">랭킹에 등록되었습니다! 🎉</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {entries.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {entries.map((e, i) => (
            <li
              key={`${e.nickname}-${e.created_at}`}
              className="flex items-center justify-between text-sm px-2 py-1 rounded-md odd:bg-white"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-6 shrink-0 text-center font-bold text-gray-400">
                  {MEDALS[i] ?? i + 1}
                </span>
                <span className="truncate text-gray-800">{e.nickname}</span>
              </span>
              <span className="font-bold text-gray-700 tabular-nums">
                {e.score}
                {e.grade && <span className="text-xs text-gray-400 ml-1">{e.grade}</span>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-400">아직 등록된 점수가 없어요. 첫 기록에 도전하세요!</p>
      )}
    </div>
  );
}
