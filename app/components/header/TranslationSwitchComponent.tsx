"use client";

import { Switch, cn, Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { useSettings } from "../SettingsContext";
import { Icons } from "../icons";

declare global {
  interface Window {
    setTranslationSettings?: (enabled: boolean, serverUrl: string) => void;
  }
}

export default function TranslationSwitchComponent() {
  const { language, translationEnabled, setTranslationEnabled } = useSettings();
  const [serviceStatus, setServiceStatus] = useState<
    "unknown" | "ready" | "starting" | "failed"
  >("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const translations = {
    en: {
      enableTranslation: "Enable Estonian → English Translation",
      translationDescription:
        "Real-time translation using AI translation service.",
      testConnection: "Test Service",
      serviceReady: "✅ Service Ready",
      serviceFailed: "❌ Service Unavailable",
      serviceStarting: "🔄 Service Starting Up...",
      serviceTesting: "🔄 Testing...",
      startupNotice:
        "The translation service takes about 2 minutes to start up when first accessed.",
      resetSession: "Reset Translation Context",
    },
    et: {
      enableTranslation: "Luba eesti → inglise tõlge",
      translationDescription: "Reaalajas tõlkimine AI tõlketeenuse abil.",
      testConnection: "Testi teenust",
      serviceReady: "✅ Teenus valmis",
      serviceFailed: "❌ Teenus pole saadaval",
      serviceStarting: "🔄 Teenus käivitub...",
      serviceTesting: "🔄 Testimine...",
      startupNotice:
        "Tõlketeenus vajab esmasel kasutamisel umbes 2 minutit käivitumiseks.",
      resetSession: "Lähtesta tõlke kontekst",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.en;

  // Function to update translation settings in app-asr.js
  const updateTranslationSettings = (enabled: boolean) => {
    if (window.setTranslationSettings) {
      window.setTranslationSettings(enabled, "/api/translate");
    }
  };

  // Test connection to translation service
  const testService = async () => {
    setIsChecking(true);
    setServiceStatus("unknown");
    setStatusMessage("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/translate", {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.status === "healthy") {
        setServiceStatus("ready");
        setStatusMessage(data.message);
      } else if (response.status === 503) {
        setServiceStatus("starting");
        setStatusMessage(data.message || "Service is starting up...");
      } else {
        setServiceStatus("failed");
        setStatusMessage(data.message || "Service unavailable");
      }
    } catch (error) {
      console.error("Service test failed:", error);
      setServiceStatus("failed");
      setStatusMessage("Connection failed");
    } finally {
      setIsChecking(false);
    }
  };

  // Reset translation session
  const resetSession = async () => {
    try {
      const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
      await fetch(`/api/translate?session_id=${sessionId}`, {
        method: "DELETE",
      });
      console.log("Translation session reset");
    } catch (error) {
      console.error("Failed to reset session:", error);
    }
  };

  // Effect to update settings when enabled state changes
  useEffect(() => {
    updateTranslationSettings(translationEnabled);
  }, [translationEnabled]);

  // Test service on first load if translation is enabled
  useEffect(() => {
    if (translationEnabled && serviceStatus === "unknown") {
      testService();
    }
  }, [translationEnabled]);

  const getServiceStatusText = () => {
    if (isChecking) {
      return t.serviceTesting;
    }

    switch (serviceStatus) {
      case "ready":
        return t.serviceReady;
      case "starting":
        return t.serviceStarting;
      case "failed":
        return t.serviceFailed;
      case "unknown":
      default:
        return t.testConnection;
    }
  };

  const getServiceStatusColor = () => {
    switch (serviceStatus) {
      case "ready":
        return "text-green-400";
      case "starting":
        return "text-yellow-400";
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
            "data-[selected=true]:border-white data-[selected=true]:bg-gray-700",
            "relative"
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

        {/* Beta badge positioned in top-right corner */}
        <span className="absolute -top-3 -left-9 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm border border-blue-400/30 transform -rotate-45">
          🛠️ Beta
        </span>
      </Switch>

      {translationEnabled && (
        <div className="flex flex-col mt-1 gap-3 bg-gray-900 rounded-lg p-3">
          {/* Service Status */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              onClick={testService}
              disabled={isChecking}
              className={`${getServiceStatusColor()} bg-transparent hover:bg-gray-800 transition-colors duration-200`}
            >
              {getServiceStatusText()}
            </Button>

            <Button
              size="sm"
              onClick={resetSession}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Icons.loader size={14} />
              <span className="hidden sm:inline ml-1">{t.resetSession}</span>
            </Button>
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
              {statusMessage}
            </div>
          )}

          {/* Service starting notice */}
          {serviceStatus === "starting" && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 rounded p-2 border border-yellow-900/50">
              ⚠️ {t.startupNotice}
            </div>
          )}

          {/* Service ready notice */}
          {serviceStatus === "ready" && (
            <div className="text-xs text-green-400 bg-green-900/20 rounded p-2 border border-green-900/50">
              ✅ Translation service is ready and responding quickly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
