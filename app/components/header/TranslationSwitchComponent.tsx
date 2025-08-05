"use client";

import { Switch, cn, Input } from "@heroui/react";
import { useEffect, useState } from "react";
import { useSettings } from "../SettingsContext";
import { Icons } from "../icons";

declare global {
  interface Window {
    setTranslationSettings?: (enabled: boolean, serverUrl: string) => void;
  }
}

export default function TranslationSwitchComponent() {
  const { language } = useSettings();
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://localhost:8080");
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "failed"
  >("unknown");

  const translations = {
    en: {
      enableTranslation: "Enable Estonian → English Translation",
      translationDescription:
        "Send ASR text to translation server for real-time translation.",
      serverUrl: "Translation Server URL:",
      testConnection: "Test Connection",
      connectionOk: "✅ Connected",
      connectionFailed: "❌ Connection Failed",
      connectionTesting: "🔄 Testing...",
      placeholder: "http://localhost:8080",
    },
    et: {
      enableTranslation: "Luba eesti → inglise tõlge",
      translationDescription:
        "Saada ASR tekst tõlkeserverisse reaalajas tõlkimiseks.",
      serverUrl: "Tõlkeserveri URL:",
      testConnection: "Testi ühendust",
      connectionOk: "✅ Ühendatud",
      connectionFailed: "❌ Ühendus ebaõnnestus",
      connectionTesting: "🔄 Testimine...",
      placeholder: "http://localhost:8080",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.en;

  // Function to update translation settings in app-asr.js
  const updateTranslationSettings = (enabled: boolean, url: string) => {
    if (window.setTranslationSettings) {
      window.setTranslationSettings(enabled, url);
    }
  };

  // Test connection to translation server
  const testConnection = async () => {
    setConnectionStatus("unknown");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${serverUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionStatus("connected");
        setTimeout(() => setConnectionStatus("unknown"), 3000);
      } else {
        setConnectionStatus("failed");
        setTimeout(() => setConnectionStatus("unknown"), 3000);
      }
    } catch (error) {
      setConnectionStatus("failed");
      setTimeout(() => setConnectionStatus("unknown"), 3000);
    }
  };

  // Effect to update settings when enabled state or URL changes
  useEffect(() => {
    updateTranslationSettings(translationEnabled, serverUrl);
  }, [translationEnabled, serverUrl]);

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return t.connectionOk;
      case "failed":
        return t.connectionFailed;
      case "unknown":
      default:
        return t.testConnection;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "unknown":
      default:
        return "text-blue-400 hover:text-blue-300";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Switch
        style={{ touchAction: "pan-y" }}
        isSelected={translationEnabled}
        onChange={(e) => setTranslationEnabled(e.target.checked)}
        classNames={{
          base: cn(
            "inline-flex flex-row-reverse w-full max-w-md bg-gray-900 hover:bg-gray-800 hover:border-dashed items-center",
            "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-gray-900",
            "data-[selected=true]:border-white data-[selected=true]:bg-gray-700"
          ),
          wrapper: "p-0 h-4 overflow-visible",
          thumb: cn(
            "w-6 h-6 border-2 shadow-lg",
            "group-data-[hover=true]:border-white",
            // selected
            "group-data-[selected=true]:ml-6",
            // pressed
            "group-data-[pressed=true]:w-7",
            "group-data-[selected]:group-data-[pressed]:ml-4"
          ),
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icons.languages size={16} color="white" />
            <p className="text-medium text-white">{t.enableTranslation}</p>
          </div>
          <p className="text-tiny text-white">{t.translationDescription}</p>
        </div>
      </Switch>

      {translationEnabled && (
        <div className="flex flex-col mt-1 gap-3 bg-gray-900 rounded-lg p-3">
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm">{t.serverUrl}</label>
            <Input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={t.placeholder}
              className="text-white"
              classNames={{
                input: "bg-gray-800 text-white",
                inputWrapper:
                  "bg-gray-800 border-gray-700 hover:border-gray-600",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={testConnection}
              disabled={
                connectionStatus === "unknown" && serverUrl.trim() === ""
              }
              className={`text-sm ${getConnectionStatusColor()} transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getConnectionStatusText()}
            </button>

            {translationEnabled && (
              <div className="text-xs text-gray-400">
                Session: {`session-${Math.random().toString(36).substr(2, 4)}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
