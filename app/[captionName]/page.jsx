// [captionName]/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../firebaseConfig"; // Adjust the path if necessary
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { Tooltip, Button, useDisclosure } from "@heroui/react";
import { Icons } from "../components/icons";
import CaptionViewerSettingsDrawer from "../components/viewer/CaptionViewerSettingsDrawer";
import CaptionViewerDisplay from "../components/viewer/CaptionViewerDisplay";
import { useCaptionViewerSettings } from "../components/viewer/useCaptionViewerSettings";
import { DEFAULT_CAPTION_VIEWER_SETTINGS } from "../components/viewer/captionViewerSettings";
import { useAutoScroll } from "../hooks/useAutoScroll";

const normalizeCaptionText = (value) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const toRgb = (hex) => {
  const raw = hex.replace("#", "").trim();
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : raw;

  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) return { r: 255, g: 255, b: 255 };

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function LiveCaptionsPage() {
  const params = useParams();
  const captionName = params.captionName;
  const [captionText, setCaptionText] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const { isOpen, onOpenChange } = useDisclosure();
  const { settings, setSettings, resetSettings } = useCaptionViewerSettings();
  const { scrollRef, isScrolledUp, scrollToBottom } = useAutoScroll({
    content: captionText,
    threshold: 320,
    buttonThreshold: 420,
    enabled: true,
    autoBehavior: "auto",
    manualBehavior: "smooth",
  });

  const isDefaultTheme =
    settings.textColor.toLowerCase() ===
      DEFAULT_CAPTION_VIEWER_SETTINGS.textColor.toLowerCase() &&
    settings.backgroundColor.toLowerCase() ===
      DEFAULT_CAPTION_VIEWER_SETTINGS.backgroundColor.toLowerCase();
  const logoSrc = isDefaultTheme
    ? "/images/TalTech_logo.png"
    : "/images/TalTech_logo_pink.png";

  const topActionButtonStyle = {
    borderColor: withAlpha(settings.textColor, 0.2),
    backgroundColor: withAlpha(settings.textColor, 0.06),
    color: withAlpha(settings.textColor, 0.92),
    boxShadow: `inset 0 1px 0 ${withAlpha(settings.textColor, 0.1)}`,
  };

  useEffect(() => {
    if (!captionName) return;

    const captionDoc = doc(db, "captions", captionName);
    const unsubscribe = onSnapshot(captionDoc, (doc) => {
      if (doc.exists()) {
        setCaptionText(normalizeCaptionText(doc.data().text));
      } else {
        setCaptionText("No captions available.");
      }
    });

    return () => unsubscribe();
  }, [captionName]);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight();
    });
    resizeObserver.observe(headerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(captionText || "");
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch (e) {
      console.error("Failed to copy text", e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Fixed top header */}
      <div
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-30 border-b backdrop-blur-xl"
        style={{
          borderColor: withAlpha(settings.textColor, 0.14),
          backgroundColor: withAlpha(settings.backgroundColor, 0.9),
          paddingTop: "max(env(safe-area-inset-top, 0px), 0px)",
        }}
      >
        <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Image
              src={logoSrc}
              alt="Logo"
              width={90}
              height={64}
              className="h-10 w-auto shrink-0 opacity-90 sm:h-12 md:h-14"
            />
            <div className="min-w-0">
              <h1
                className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] leading-tight sm:text-[1.22rem] md:text-[1.35rem]"
                style={{ color: settings.textColor }}
              >
                Live Captions
              </h1>
              <p
                className="text-xs leading-snug sm:text-sm"
                style={{ color: settings.textColor, opacity: 0.72 }}
              >
                Shareable real-time transcript
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-2">
            <Tooltip content="Display settings" showArrow={true}>
              <Button
                onPress={onOpenChange}
                size="sm"
                aria-label="Display settings"
                className="h-10 min-h-0 min-w-0 rounded-xl border px-0 transition-opacity hover:opacity-90 sm:min-w-[112px] sm:px-3"
                style={topActionButtonStyle}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icons.settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </div>
              </Button>
            </Tooltip>

            <Tooltip
              content={copiedLink ? "Link copied" : "Copy share link"}
              showArrow={true}
            >
              <Button
                onPress={handleCopyLink}
                size="sm"
                aria-label={copiedLink ? "Link copied" : "Copy share link"}
                className="h-10 min-h-0 min-w-0 rounded-xl border px-0 transition-opacity hover:opacity-90 sm:min-w-[112px] sm:px-3"
                style={topActionButtonStyle}
              >
                {copiedLink ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Icons.check className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Icons.link className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy link</span>
                  </div>
                )}
              </Button>
            </Tooltip>

            <Tooltip
              content={copiedAll ? "Text copied" : "Copy all text"}
              showArrow={true}
            >
              <Button
                onPress={handleCopyAll}
                size="sm"
                aria-label={copiedAll ? "Text copied" : "Copy all text"}
                className="h-10 min-h-0 min-w-0 rounded-xl border px-0 transition-opacity hover:opacity-90 sm:min-w-[112px] sm:px-3"
                style={topActionButtonStyle}
              >
                {copiedAll ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Icons.check className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Icons.copy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy all</span>
                  </div>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Full-page display area */}
      <div
        ref={scrollRef}
        className="relative z-10 h-full w-full overflow-auto px-3 sm:px-5 md:px-6"
        style={{
          paddingTop: `${headerHeight + 10}px`,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
        }}
      >
        <CaptionViewerDisplay
          text={captionText}
          settings={settings}
          placeholder="Waiting for captions…"
        />
      </div>

      {isScrolledUp && (
        <Tooltip content="Scroll to bottom" showArrow={true}>
          <Button
            onPress={scrollToBottom}
            size="sm"
            variant="ghost"
            className="fixed left-1/2 z-20 min-h-[40px] min-w-[40px] -translate-x-1/2 rounded-full border p-2 backdrop-blur-xl"
            style={{
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
              borderColor: withAlpha(settings.textColor, 0.24),
              backgroundColor: withAlpha(settings.backgroundColor, 0.86),
              color: withAlpha(settings.textColor, 0.92),
            }}
            isIconOnly
          >
            <Icons.arrowDown className="h-5 w-5 flex-shrink-0" />
          </Button>
        </Tooltip>
      )}

      <CaptionViewerSettingsDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        settings={settings}
        onChange={setSettings}
        onReset={resetSettings}
      />
    </div>
  );
}
