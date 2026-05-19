export interface TranscriptBlock {
  text: string;
  previewSuffix?: string;
}

export interface AsrEventPayload {
  type?: "idle" | "partial" | "final" | "reset";
  utteranceId?: string | null;
  partialText?: string;
  finalText?: string;
  normalizedText?: string;
  isFinal?: boolean;
  sequence?: number;
  timestamp?: string | null;
  tokenTimestamps?: unknown;
  wordTimestamps?: unknown;
  sourceType?: "microphone" | "file";
  sourceTimeSec?: number | null;
  sourceDurationSec?: number | null;
}

export interface TranscriptUpdateDetail {
  blocks?: TranscriptBlock[];
  completedText?: string;
  activeText?: string;
  combinedText?: string;
  activeUtteranceId?: string | null;
  asr?: AsrEventPayload;
  sourceType?: "microphone" | "file";
  sourceTimeSec?: number | null;
  sourceDurationSec?: number | null;
}
