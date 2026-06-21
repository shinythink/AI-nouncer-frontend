"use client";

import { FormEvent, useMemo, useState } from "react";
import { checkNickname, createAccount } from "@/lib/api";
import { PendingProfile, User } from "@/types/analysis";

interface Props {
  profile: PendingProfile;
  onComplete: (user: User) => void;
}

type CheckState = "idle" | "checking" | "available" | "taken";

export default function NicknameSetup({ profile, onComplete }: Props) {
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cleanNickname = useMemo(() => nickname.trim().split(/\s+/).join(" "), [nickname]);
  const canCheck = cleanNickname.length > 0 && cleanNickname.length <= 20 && !busy;
  const canCreate =
    checkState === "available" && checkedNickname === cleanNickname && canCheck;

  function handleChange(value: string) {
    setNickname(value);
    setCheckedNickname("");
    setCheckState("idle");
    setMessage(null);
  }

  async function runCheck(): Promise<boolean> {
    if (!cleanNickname) {
      setCheckState("taken");
      setMessage("닉네임을 입력하세요.");
      return false;
    }
    if (cleanNickname.length > 20) {
      setCheckState("taken");
      setMessage("닉네임은 20자 이하여야 합니다.");
      return false;
    }

    setCheckState("checking");
    setMessage(null);
    try {
      const result = await checkNickname(cleanNickname);
      setCheckedNickname(cleanNickname);
      if (result.available) {
        setCheckState("available");
        setMessage("사용할 수 있는 닉네임입니다.");
        return true;
      }
      setCheckState("taken");
      setMessage(result.reason ?? "이미 사용 중인 닉네임입니다.");
      return false;
    } catch {
      setCheckState("taken");
      setMessage("중복 확인에 실패했습니다. 잠시 후 다시 시도하세요.");
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const checked = canCreate ? true : await runCheck();
    if (!checked) return;

    setBusy(true);
    setMessage(null);
    try {
      const user = await createAccount(cleanNickname);
      onComplete(user);
    } catch (e) {
      setCheckState("taken");
      setMessage(e instanceof Error ? e.message : "계정 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-black text-gray-900 mb-2">닉네임 설정</h1>
        <p className="text-sm text-gray-500">챌린지와 랭킹에 표시될 이름을 정하세요</p>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.picture} alt="" className="w-11 h-11 rounded-full" />
        ) : (
          <span className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            {profile.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{profile.name}</p>
          {profile.email && <p className="text-xs text-gray-500 truncate">{profile.email}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nickname" className="text-sm font-semibold text-gray-700">
          닉네임
        </label>
        <div className="flex gap-2">
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={20}
            placeholder="예: 발음마스터"
            className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={runCheck}
            disabled={!canCheck || checkState === "checking"}
            className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkState === "checking" ? "확인 중" : "중복 확인"}
          </button>
        </div>
        {message && (
          <p
            className={`text-xs ${
              checkState === "available" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canCreate || busy}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "계정 생성 중..." : "계정 생성하고 시작하기"}
      </button>
    </form>
  );
}
