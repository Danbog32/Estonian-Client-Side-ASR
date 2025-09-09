// [captionName]/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../firebaseConfig"; // Adjust the path if necessary
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { ScrollShadow, Tooltip, Button } from "@heroui/react";
import { Icons } from "../components/icons";

export default function LiveCaptionsPage() {
  const params = useParams();
  const captionName = params.captionName;
  const [captionText, setCaptionText] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!captionName) return;

    const captionDoc = doc(db, "captions", captionName);
    const unsubscribe = onSnapshot(captionDoc, (doc) => {
      if (doc.exists()) {
        setCaptionText(doc.data().text);
      } else {
        setCaptionText("No captions available.");
      }
    });

    return () => unsubscribe();
  }, [captionName]);

  // Auto-scroll to bottom when caption text updates
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [captionText]);

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
    <div className="bg-gray-800 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-[1200px] text-white p-4 md:p-8 flex flex-col gap-4">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between bg-gray-900/40 border border-gray-700/50 rounded-xl px-3 py-2 md:px-4 md:py-3 shadow-lg">
          <div className="flex items-center gap-3 md:gap-4">
            <Image
              src="/images/TalTech_logo.png"
              alt="Logo"
              width={90}
              height={64}
              className="opacity-90"
            />
            <div>
              <h1 className="text-base md:text-lg font-semibold">
                Live Captions
              </h1>
              <p className="text-xs md:text-sm text-gray-400">
                Shareable real-time transcript
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip
              content={copiedLink ? "Link copied" : "Copy share link"}
              showArrow={true}
            >
              <Button
                onPress={handleCopyLink}
                size="sm"
                className="bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 hover:text-white border border-gray-600/50"
              >
                {copiedLink ? (
                  <div className="flex items-center gap-1">
                    <Icons.check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Icons.link className="w-4 h-4" />
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
                className="bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 hover:text-white border border-gray-600/50"
              >
                {copiedAll ? (
                  <div className="flex items-center gap-1">
                    <Icons.check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Icons.copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy all</span>
                  </div>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Main panel */}
        <div className="w-full flex-1 bg-gray-900/40 border border-gray-700/50 rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-gray-900/40 border-b border-gray-700/50">
            <Icons.languages className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm md:text-base font-medium">
              Live transcript
            </h3>
          </div>
          <ScrollShadow
            className="text-white overflow-auto p-3 md:p-4"
            style={{ fontSize: "1.1rem", lineHeight: 1.6 }}
            ref={scrollRef}
          >
            {captionText ? (
              <pre className="whitespace-pre-wrap break-words text-blue-50/95">
                {captionText}
              </pre>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Icons.languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No captions available yet</p>
              </div>
            )}
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
}
