"use client";

import { Settings } from "lucide-react";

interface TopBarProps {
  isRecording: boolean;
  onOpenSettings: () => void;
}

export default function TopBar({ isRecording, onOpenSettings }: TopBarProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <button
        onClick={onOpenSettings}
        className="pointer-events-auto w-11 h-11 rounded-full grid place-items-center bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 transition-all hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>

      {isRecording && (
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        </div>
      )}

      <div className="w-11" />
    </div>
  );
}
