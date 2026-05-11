"use client";

import { useEffect, useState } from "react";
import SentenceInput from "@/components/SentenceInput";
import Recorder from "@/components/Recorder";
import ResultCard from "@/components/ResultCard";
import ChoiceScreen from "@/components/ChoiceScreen";
import AllResultsCard, { VariantResult } from "@/components/AllResultsCard";
import {
  fetchSentences,
  analyzeFree,
  analyzeById,
  ANALYZE_VARIANTS,
} from "@/lib/api";
import { AnalysisResponse, Sentence } from "@/types/analysis";

type Stage = "select" | "recording" | "choose" | "result" | "results-all";
type LoadingKind = "original" | "all" | null;

export default function Home() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [stage, setStage] = useState<Stage>("select");
  const [selected, setSelected] = useState<Sentence | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [choiceLoading, setChoiceLoading] = useState<LoadingKind>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [allResults, setAllResults] = useState<VariantResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentences()
      .then(setSentences)
      .catch(() => setError("문장 목록을 불러오지 못했습니다. 백엔드가 실행 중인지 확인하세요."));
  }, []);

  function handleSelect(sentence: Sentence) {
    setSelected(sentence);
    setResult(null);
    setAllResults(null);
    setAudioBlob(null);
    setError(null);
    setStage("recording");
  }

  function handleAudio(blob: Blob) {
    setAudioBlob(blob);
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
    setError(null);
    setResult(null);
    setAllResults(null);
    setAudioBlob(null);
    setStage("recording");
  }

  function backToSelect() {
    setError(null);
    setResult(null);
    setAllResults(null);
    setAudioBlob(null);
    setSelected(null);
    setStage("select");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {error && (
        <div className="mb-6 w-full max-w-lg bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stage === "select" && (
        <SentenceInput sentences={sentences} onSelect={handleSelect} />
      )}

      {stage === "recording" && selected && (
        <Recorder
          sentence={selected.text}
          onResult={handleAudio}
          loading={false}
        />
      )}

      {stage === "choose" && selected && (
        <ChoiceScreen
          sentence={selected.text}
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
