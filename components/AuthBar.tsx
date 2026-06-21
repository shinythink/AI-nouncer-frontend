"use client";

import { User } from "@/types/analysis";

interface Props {
  user: User | null;
  onLogout: () => void;
}

export default function AuthBar({ user, onLogout }: Props) {
  if (!user) return null;

  return (
    <div className="fixed top-3 right-3 z-10">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
            {user.name.slice(0, 1)}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[8rem] truncate">{user.name}</span>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
