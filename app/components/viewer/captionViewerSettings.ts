export type CaptionViewerHorizontalAlignment =
  | "full"
  | "left"
  | "center"
  | "right";

export type CaptionViewerFontWeight = 400 | 600;

export type CaptionViewerViewMode = "captions" | "transcript";

export type CaptionViewerSettings = {
  viewMode: CaptionViewerViewMode;
  fontSizePx: number;
  lineHeight: number;
  fontWeight: CaptionViewerFontWeight;
  letterSpacingEm: number;
  textColor: string;
  backgroundColor: string;
  horizontalAlignment: CaptionViewerHorizontalAlignment;
};

export const CAPTION_VIEWER_SETTINGS_STORAGE_KEY = "caption-viewer-settings:v1";

export const DEFAULT_CAPTION_VIEWER_SETTINGS: CaptionViewerSettings = {
  viewMode: "captions",
  fontSizePx: 18,
  lineHeight: 1.6,
  fontWeight: 400,
  letterSpacingEm: 0.02,
  textColor: "#EAF2FF",
  backgroundColor: "#0B1220",
  horizontalAlignment: "full",
};

const clampNumber = (value: unknown, min: number, max: number): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
};

const isHexColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return /^#([0-9a-f]{3}){1,2}$/i.test(value);
};

export const sanitizeCaptionViewerSettings = (
  raw: unknown
): CaptionViewerSettings => {
  const base: CaptionViewerSettings = { ...DEFAULT_CAPTION_VIEWER_SETTINGS };
  if (!raw || typeof raw !== "object") return base;

  const candidate = raw as Partial<CaptionViewerSettings>;

  const fontSizePx = clampNumber(candidate.fontSizePx, 12, 120);
  if (fontSizePx != null) base.fontSizePx = fontSizePx;

  const lineHeight = clampNumber(candidate.lineHeight, 1, 3);
  if (lineHeight != null) base.lineHeight = Number(lineHeight.toFixed(2));

  if (candidate.fontWeight === 400 || candidate.fontWeight === 600) {
    base.fontWeight = candidate.fontWeight;
  }

  const letterSpacingEm = clampNumber(candidate.letterSpacingEm, 0, 0.2);
  if (letterSpacingEm != null) {
    base.letterSpacingEm = Number(letterSpacingEm.toFixed(3));
  }

  if (isHexColor(candidate.textColor)) base.textColor = candidate.textColor;
  if (isHexColor(candidate.backgroundColor)) {
    base.backgroundColor = candidate.backgroundColor;
  }

  if (candidate.viewMode === "captions" || candidate.viewMode === "transcript") {
    base.viewMode = candidate.viewMode;
  }

  if (
    candidate.horizontalAlignment === "full" ||
    candidate.horizontalAlignment === "left" ||
    candidate.horizontalAlignment === "center" ||
    candidate.horizontalAlignment === "right"
  ) {
    base.horizontalAlignment = candidate.horizontalAlignment;
  }

  return base;
};
