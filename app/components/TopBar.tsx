"use client";

import { Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TopBarProps {
  isRecording: boolean;
  onOpenSettings: () => void;
}

export default function TopBar({ isRecording, onOpenSettings }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none max-md:px-3 max-md:py-2 max-md:pt-0">
      <Link
        href="https://taltech.ee/en/laboratory-language-technology"
        target="_blank"
        className="pointer-events-auto"
      >
        <Image
          src="/images/TalTech_logo_pink.png"
          alt="TalTech Logo"
          width={100}
          height={100}
        />
      </Link>

      <button
        onClick={onOpenSettings}
        className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 transition-all hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-md:h-10 max-md:w-10"
        aria-label="Settings"
      >
        <Settings size={20} className="max-md:h-[18px] max-md:w-[18px]" />
      </button>
    </div>
  );
}
