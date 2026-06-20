"use client";

import { useEffect, useState } from "react";
import ModeSelect from "@/components/ModeSelect";
import SentenceInput from "@/components/SentenceInput";
import Recorder from "@/components/Recorder";
import ResultCard from "@/components/ResultCard";
import ChoiceScreen from "@/components/ChoiceScreen";
import AllResultsCard, { VariantResult } from "@/components/AllResultsCard";
import {
  fetchSentences,
  analyzeFree,
  analyzeById,
  analyzeBoss,
  ANALYZE_VARIANTS,
} from "@/lib/api";
import { AnalysisResponse, GameMode, Sentence } from "@/types/analysis";

type Stage = "mode" | "select" | "recording" | "choose" | "result" | "results-all";
type LoadingKind = "original" | "all" | null;

export default function Home() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<GameMode>("accuracy");
  const [selected, setSelected] = useState<Sentence | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [choiceLoading, setChoiceLoading] = useState<LoadingKind>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [allResults, setAllResults] = useState<VariantResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentences()
      .then(setSentences)
      .catch(() => setError("문장 목록을 불러오지 못했습니다. 백엔드가 실행 중인지 확인하세요."));
  }, []);

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
    resetRound();
    setStage("select");
  }

  function handleSelect(sentence: Sentence) {
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
      const data =
        mode === "boss"
          ? await analyzeBoss(audioBlob, selected.id)
          : await analyzeFree(audioBlob, selected.text);
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

  function backToMode() {
    resetRound();
    setSelected(null);
    setStage("mode");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {error && (
        <div className="mb-6 w-full max-w-lg bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stage === "mode" && <ModeSelect onSelect={handleMode} />}

      {stage === "select" && (
        <SentenceInput
          sentences={sentences}
          mode={mode}
          onSelect={handleSelect}
          onBack={backToMode}
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
    </main>
  );
}
