"use client";

import { loginUrl } from "@/lib/api";

interface Props {
  loginError?: boolean;
}

export default function LoginScreen({ loginError = false }: Props) {
  return (
    <div className="flex flex-col gap-7 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-2">AI-nouncer</h1>
        <p className="text-sm text-gray-500">로그인하고 한국어 발음 챌린지를 시작하세요</p>
      </div>

      {loginError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          로그인에 실패했습니다. OAuth 설정과 Google 계정을 확인한 뒤 다시 시도하세요.
        </div>
      )}

      <a
        href={loginUrl()}
        className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 text-base font-bold transition-colors shadow-sm"
      >
        <span className="text-lg">G</span>
        Google OAuth로 로그인
      </a>
    </div>
  );
}
