"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Check,
  QrCode,
  Share2,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "../../providers/SettingsContext";
import QRCode from "react-qr-code";

declare global {
  interface Window {
    setFirebaseSettings?: (enabled: boolean, captionName: string) => void;
  }
}

export default function FirebaseApiSwitchComponent() {
  const {
    firebaseEnabled,
    setFirebaseEnabled,
    captionName,
    setCaptionName,
    captionURL,
    setCaptionURL,
    language,
  } = useSettings();

  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const translations = {
    en: {
      title: "Cast to multiple people",
      description: "Share a link so others can follow along on their devices",
      enable: "Enable casting",
      disable: "Stop casting",
      shareLink: "Share link",
      copyLink: "Copy link",
      copied: "Copied!",
      qrCode: "QR Code",
      hideQR: "Hide QR",
      tapQR: "Tap QR code to copy link",
    },
    et: {
      title: "Saada mitmele inimesele",
      description:
        "Jaga linki, et teised saaksid oma seadmetes kaasa vaadata",
      enable: "Lülita sisse",
      disable: "Peata saatmine",
      shareLink: "Jaga linki",
      copyLink: "Kopeeri link",
      copied: "Kopeeritud!",
      qrCode: "QR-kood",
      hideQR: "Peida QR",
      tapQR: "Puuduta QR-koodi lingi kopeerimiseks",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.en;

  const updateFirebaseSettings = (enabled: boolean, name: string) => {
    if (window.setFirebaseSettings) {
      window.setFirebaseSettings(enabled, name);
    }
  };

  useEffect(() => {
    if (firebaseEnabled) {
      if (!captionName) {
        const name = `caption-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        setCaptionName(name);
        const url = `${window.location.origin}/${name}`;
        setCaptionURL(url);
        updateFirebaseSettings(true, name);
      }
    } else {
      setCaptionName("");
      setCaptionURL("");
      updateFirebaseSettings(false, "");
    }
  }, [captionName, firebaseEnabled, setCaptionName, setCaptionURL]);

  const handleCopyLink = async () => {
    if (!captionURL) return;
    try {
      await navigator.clipboard.writeText(captionURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = captionURL;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle button */}
      <button
        type="button"
        className={`
          flex min-h-[72px] items-center justify-between rounded-[16px] border-[1.5px] px-4 py-3
          text-left transition-all duration-[250ms]
          ${
            firebaseEnabled
              ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.18)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
              : "border-white/10 bg-white/[0.03] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05]"
          }
        `}
        onClick={() => setFirebaseEnabled(!firebaseEnabled)}
        aria-pressed={firebaseEnabled}
      >
        <div className="flex items-center gap-3">
          <Share2
            className={`h-5 w-5 shrink-0 ${firebaseEnabled ? "text-[#72adff]" : "text-white/50"}`}
          />
          <div>
            <div className="text-sm font-[650] text-white/90">{t.title}</div>
            <div className="mt-0.5 text-[0.8rem] leading-snug text-white/50">
              {firebaseEnabled ? t.disable : t.description}
            </div>
          </div>
        </div>

        <div
          className={`
            relative ml-3 h-7 w-12 shrink-0 rounded-full transition-colors duration-200
            ${firebaseEnabled ? "bg-[#3b82f6]" : "bg-white/15"}
          `}
        >
          <div
            className={`
              absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200
              ${firebaseEnabled ? "translate-x-[22px]" : "translate-x-0.5"}
            `}
          />
        </div>
      </button>

      {/* Expanded section when enabled */}
      {firebaseEnabled && captionURL && (
        <div className="flex flex-col gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* URL display + copy */}
          <div className="flex items-center gap-2 rounded-xl bg-black/30 p-3">
            <LinkIcon className="h-4 w-4 shrink-0 text-white/40" />
            <a
              href={captionURL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-sm text-[#72adff] hover:underline"
            >
              {captionURL}
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`
                grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200
                ${copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/90"}
              `}
              aria-label={copied ? t.copied : t.copyLink}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {copied && (
            <p className="text-center text-xs font-medium text-emerald-400">
              {t.copied}
            </p>
          )}

          {/* QR Code toggle */}
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white/90"
          >
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>{showQR ? t.hideQR : t.qrCode}</span>
            </div>
            {showQR ? (
              <ChevronDown className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/40" />
            )}
          </button>

          {showQR && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <div
                className="cursor-pointer rounded-2xl bg-white p-4 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleCopyLink}
                style={{ touchAction: "pan-y" }}
              >
                <QRCode value={captionURL} size={180} />
              </div>
              <p className="text-xs text-white/40">{t.tapQR}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
