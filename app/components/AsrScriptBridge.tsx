"use client";

import Script from "next/script";

interface AsrScriptBridgeProps {
  onLoad?: () => void;
}

export default function AsrScriptBridge({ onLoad }: AsrScriptBridgeProps) {
  return (
    <>
      <Script src="/onnx/app-asr.js" strategy="afterInteractive" onLoad={onLoad} />

      <div id="transcriptText" className="hidden" />
      <div id="sound-clips" className="hidden" />
      <button id="startBtn" disabled className="hidden" />
      <button id="stopBtn" disabled className="hidden" />
      <button id="clearBtn" className="hidden" />
    </>
  );
}
