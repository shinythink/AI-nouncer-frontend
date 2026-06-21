"use client";

import { useEffect, useState } from "react";
import ModeSelect from "@/components/ModeSelect";
import CategorySelect from "@/components/CategorySelect";
import SentenceInput from "@/components/SentenceInput";
import Recorder from "@/components/Recorder";
import ResultCard from "@/components/ResultCard";
import ChoiceScreen from "@/components/ChoiceScreen";
import AllResultsCard, { VariantResult } from "@/components/AllResultsCard";
import AuthBar from "@/components/AuthBar";
import LoginScreen from "@/components/LoginScreen";
import NicknameSetup from "@/components/NicknameSetup";
import {
  fetchSentences,
  fetchAuthStatus,
  logout,
  analyzeFree,
  analyzeById,
  ANALYZE_VARIANTS,
} from "@/lib/api";
import { AnalysisResponse, Category, GameMode, PendingProfile, Sentence, User } from "@/types/analysis";

type Stage =
  | "login"
  | "nickname"
  | "mode"
  | "category"
  | "select"
  | "recording"
  | "choose"
  | "result"
  | "results-all";
type LoadingKind = "original" | "all" | null;

export default function Home() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [stage, setStage] = useState<Stage>("login");
  const [mode, setMode] = useState<GameMode>("accuracy");
  const [selected, setSelected] = useState<Sentence | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [choiceLoading, setChoiceLoading] = useState<LoadingKind>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [allResults, setAllResults] = useState<VariantResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingProfile, setPendingProfile] = useState<PendingProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    fetchSentences()
      .then(setSentences)
      .catch(() => setError("문장 목록을 불러오지 못했습니다. 백엔드가 실행 중인지 확인하세요."));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const loginParam = params?.get("login");

      if (!cancelled) setLoginError(loginParam === "error");

      const auth = await fetchAuthStatus();
      if (cancelled) return;

      if (auth.status === "authenticated") {
        setUser(auth.user);
        setPendingProfile(null);
        setStage("mode");
      } else if (auth.status === "pending") {
        setUser(null);
        setPendingProfile(auth.profile);
        setStage("nickname");
      } else {
        setUser(null);
        setPendingProfile(null);
        setStage("login");
      }

      setAuthLoading(false);

      // OAuth 리다이렉트(?login=success|nickname|error) 흔적은 주소창에서 정리.
      if (params?.has("login") && typeof window !== "undefined") {
        params.delete("login");
        const query = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${query ? `?${query}` : ""}`
        );
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
    setPendingProfile(null);
    setSelected(null);
    setSelectedCategory(null);
    resetRound();
    setStage("login");
  }

  function handleSignupComplete(nextUser: User) {
    setUser(nextUser);
    setPendingProfile(null);
    setLoginError(false);
    setSelected(null);
    setSelectedCategory(null);
    resetRound();
    setStage("mode");
  }

  function resetRound() {
    setResult(null);
    setAllResults(null);
    setAudioBlob(null);
    setDurationMs(0);
    setError(null);
  }

  function handleMode(m: GameMode) {
    setMode(m);
    setSelected(null);
    setSelectedCategory(null);
    resetRound();
    // 타임어택은 문장 전에 "발음 카테고리"를 먼저 고른다.
    setStage(m === "timeattack" ? "category" : "select");
  }

  function handleCategory(category: Category) {
    setSelectedCategory(category);
    setSelected(null);
    resetRound();
    setStage("select");
  }

  function handleSelect(sentence: Sentence) {
    setSelected(sentence);
    resetRound();
    setStage("recording");
  }

  // 발음 훈련 루프: 추천 문장을 눌러 바로 다음 라운드로.
  function handlePractice(sentence: Sentence) {
    setSelected(sentence);
    resetRound();
    setStage("recording");
  }

  function handleAudio(blob: Blob, recordedMs: number) {
    setAudioBlob(blob);
    setDurationMs(recordedMs);
    setError(null);
    setStage("choose");
  }

  async function runOriginal() {
    if (!selected || !audioBlob) return;
    setChoiceLoading("original");
    setError(null);
    try {
      const data = await analyzeFree(audioBlob, selected.text);
      setResult(data);
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setChoiceLoading(null);
    }
  }

  async function runAll() {
    if (!selected || !audioBlob) return;
    setChoiceLoading("all");
    setError(null);

    const settled = await Promise.allSettled(
      ANALYZE_VARIANTS.map((v) => analyzeById(audioBlob, selected.id, v.path))
    );

    const merged: VariantResult[] = ANALYZE_VARIANTS.map((v, i) => {
      const r = settled[i];
      if (r.status === "fulfilled") {
        return { key: v.key, label: v.label, path: v.path, data: r.value, error: null };
      }
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      return { key: v.key, label: v.label, path: v.path, data: null, error: msg };
    });

    setAllResults(merged);
    setChoiceLoading(null);
    setStage("results-all");
  }

  function backToRecording() {
    resetRound();
    setStage("recording");
  }

  function backToSelect() {
    resetRound();
    setSelected(null);
    setStage("select");
  }

  function backToCategory() {
    resetRound();
    setSelected(null);
    setStage("category");
  }

  function backToMode() {
    resetRound();
    setSelected(null);
    setSelectedCategory(null);
    setStage("mode");
  }

  function goHome() {
    resetRound();
    setSelected(null);
    setSelectedCategory(null);
    setStage(user ? "mode" : "login");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {user && (
        <button
          type="button"
          onClick={goHome}
          className="fixed top-3 left-3 z-10 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          홈
        </button>
      )}

      <AuthBar user={user} onLogout={handleLogout} />

      {authLoading ? (
        <div className="text-sm text-gray-500">로그인 상태를 확인하는 중...</div>
      ) : (
        <>
          {error && (
            <div className="mb-6 w-full max-w-lg bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {stage === "login" && <LoginScreen loginError={loginError} />}

          {stage === "nickname" && pendingProfile && (
            <NicknameSetup profile={pendingProfile} onComplete={handleSignupComplete} />
          )}

          {stage === "mode" && <ModeSelect onSelect={handleMode} />}

          {stage === "category" && (
            <CategorySelect onSelect={handleCategory} onBack={backToMode} />
          )}

          {stage === "select" && (
            <SentenceInput
              sentences={sentences}
              mode={mode}
              category={selectedCategory?.id}
              categoryLabel={selectedCategory?.label}
              onSelect={handleSelect}
              onBack={mode === "timeattack" ? backToCategory : backToMode}
            />
          )}

          {stage === "recording" && selected && (
            <Recorder sentence={selected.text} onResult={handleAudio} loading={false} />
          )}

          {stage === "choose" && selected && (
            <ChoiceScreen
              sentence={selected.text}
              mode={mode}
              loading={choiceLoading}
              onOriginal={runOriginal}
              onAll={runAll}
              onBack={backToRecording}
            />
          )}

          {stage === "result" && result && selected && (
            <ResultCard
              sentence={selected.text}
              result={result}
              mode={mode}
              durationMs={durationMs}
              syllableCount={selected.text.replace(/[^가-힣]/g, "").length}
              sentenceId={selected.id}
              user={user}
              current={selected}
              sentences={sentences}
              onPractice={handlePractice}
              onRetry={backToRecording}
              onNew={backToSelect}
            />
          )}

          {stage === "results-all" && allResults && selected && (
            <AllResultsCard
              sentence={selected.text}
              results={allResults}
              onRetry={backToRecording}
              onNew={backToSelect}
            />
          )}
        </>
      )}
    </main>
  );
}
