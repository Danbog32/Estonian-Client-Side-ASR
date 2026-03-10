"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import {
  Settings,
  Copy,
  Check,
  Link as LinkIcon,
  ArrowDown,
  Captions,
} from "lucide-react";
import { useSettings } from "../providers/SettingsContext";
import CaptionViewerSettingsDrawer from "../components/viewer/CaptionViewerSettingsDrawer";
import CaptionViewerDisplay from "../components/viewer/CaptionViewerDisplay";
import { useCaptionViewerSettings } from "../components/viewer/useCaptionViewerSettings";
import { useAutoScroll } from "../hooks/useAutoScroll";

const normalizeCaptionText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
};

export default function LiveCaptionsPage() {
  const params = useParams();
  const captionName = params.captionName as string;
  const { language } = useSettings();

  const [captionText, setCaptionText] = useState("");
  const [hasReceived, setHasReceived] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { settings, setSettings, resetSettings } = useCaptionViewerSettings();
  const { scrollRef, isScrolledUp, scrollToBottom } =
    useAutoScroll<HTMLDivElement>({
      content: captionText,
      threshold: 320,
      buttonThreshold: 420,
      enabled: true,
      autoBehavior: "auto",
      manualBehavior: "smooth",
    });

  const hasText = captionText.trim().length > 0;

  const t =
    language === "et"
      ? {
          waiting: "Ootan subtiitreid\u2026",
          live: "Otse",
          connecting: "Ühendamine\u2026",
          copyAll: "Kopeeri kõik",
          copied: "Kopeeritud",
          copyLink: "Kopeeri link",
          linkCopied: "Link kopeeritud",
          scrollDown: "Keri alla",
          settings: "Seaded",
        }
      : {
          waiting: "Waiting for captions\u2026",
          live: "Live",
          connecting: "Connecting\u2026",
          copyAll: "Copy all",
          copied: "Copied",
          copyLink: "Copy link",
          linkCopied: "Link copied",
          scrollDown: "Scroll to bottom",
          settings: "Settings",
        };

  useEffect(() => {
    if (!captionName) return;

    const captionDoc = doc(db, "captions", captionName);
    const unsubscribe = onSnapshot(captionDoc, (snap) => {
      setHasReceived(true);
      if (snap.exists()) {
        setCaptionText(normalizeCaptionText(snap.data().text));
      } else {
        setCaptionText("");
      }
    });

    return () => unsubscribe();
  }, [captionName]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(captionText || "");
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard write failed */
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      /* clipboard write failed */
    }
  };

  const sideButtonClass =
    "w-12 h-12 rounded-full grid place-items-center bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 transition-all hover:bg-black/80 active:scale-95";

  const scrollButtonClass =
    "w-10 h-10 rounded-full grid place-items-center bg-black/70 backdrop-blur-sm border border-white/15 text-white/80 transition-all hover:bg-black/90 active:scale-95";

  return (
    <div
      className="flex h-dvh w-full flex-col overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* ── Floating top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
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
          onClick={() => setSettingsOpen(true)}
          className="pointer-events-auto w-11 h-11 rounded-full grid place-items-center bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 transition-all hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={t.settings}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── Full-screen caption area ── */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 pt-16 pb-28 sm:px-6"
        style={{ color: settings.textColor }}
        aria-live="polite"
      >
        {!hasText ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[50dvh] gap-4 select-none">
            <Captions
              size={48}
              className="text-current opacity-20"
              strokeWidth={1.5}
            />
            <p className="text-lg opacity-40 text-center">{t.waiting}</p>
          </div>
        ) : (
          <CaptionViewerDisplay
            text={captionText}
            settings={settings}
            placeholder={t.waiting}
          />
        )}
      </div>

      {/* ── Floating bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Scroll to bottom */}
        {isScrolledUp && (
          <button
            onClick={scrollToBottom}
            className={`pointer-events-auto mb-3 ${scrollButtonClass}`}
            aria-label={t.scrollDown}
          >
            <ArrowDown size={18} />
          </button>
        )}

        <div className="relative pointer-events-auto">
          {/* Copy all — left of center pill */}
          {hasText && (
            <button
              onClick={handleCopyAll}
              className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 ${sideButtonClass}`}
              aria-label={copiedAll ? t.copied : t.copyAll}
            >
              {copiedAll ? <Check size={18} /> : <Copy size={18} />}
            </button>
          )}

          {/* Center live indicator */}
          <div
            className={`w-16 h-16 rounded-full grid place-items-center ${
              hasReceived && hasText
                ? "bg-green-600 animate-live-pulse"
                : "bg-gray-600"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                hasReceived && hasText ? "bg-white" : "bg-white/40"
              }`}
            />
          </div>

          {/* Share link — right of center pill */}
          {hasText && (
            <button
              onClick={handleCopyLink}
              className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 ${sideButtonClass}`}
              aria-label={copiedLink ? t.linkCopied : t.copyLink}
            >
              {copiedLink ? <Check size={18} /> : <LinkIcon size={18} />}
            </button>
          )}
        </div>

        <span className="text-xs text-white/60 select-none mt-1.5">
          {hasReceived && hasText ? t.live : t.connecting}
        </span>
      </div>

      {/* ── Settings drawer ── */}
      <CaptionViewerSettingsDrawer
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={setSettings}
        onReset={resetSettings}
      />
    </div>
  );
}
