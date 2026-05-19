export interface ReferenceWord {
  index: number;
  display: string;
  normalized: string;
}

export type AlignmentMode = "exact" | "fuzzy" | "uncertain" | "lost";

export interface AlignmentState {
  currentWordIndex: number;
  confidence: number;
  recentTranscript: string;
  matchedPhrase: string;
  hasLock: boolean;
  lastSignalType: "idle" | "partial" | "final" | "reset";
  lastUtteranceId: string | null;
  mode: AlignmentMode;
  zoneStartIndex: number;
  zoneEndIndex: number;
}

export const INITIAL_ALIGNMENT_STATE: AlignmentState = {
  currentWordIndex: 0,
  confidence: 0,
  recentTranscript: "",
  matchedPhrase: "",
  hasLock: false,
  lastSignalType: "idle",
  lastUtteranceId: null,
  mode: "lost",
  zoneStartIndex: 0,
  zoneEndIndex: 1,
};

const TRANSCRIPT_WINDOW_WORDS = 10;
const SEARCH_BACKTRACK_WORDS = 3;
const SEARCH_LOOKAHEAD_WORDS = 26;
const INITIAL_SEARCH_SPAN_WORDS = 80;
const MIN_SENTENCE_WINDOW_WORDS = 10;

const LIGHTWEIGHT_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "was",
  "with",
  "ei",
  "ja",
  "kas",
  "ka",
  "kui",
  "kus",
  "ma",
  "me",
  "mis",
  "mu",
  "nad",
  "nii",
  "ning",
  "ole",
  "on",
  "sa",
  "see",
  "sest",
  "siin",
  "siis",
  "ta",
  "te",
  "tema",
  "see",
  "vaid",
  "või",
  "üks",
]);

type AlignmentSignal = {
  type?: "idle" | "partial" | "final" | "reset";
  utteranceId?: string | null;
};

type StepDirection = "diag" | "left" | "up";

interface CandidateMetrics {
  nextWordIndex: number;
  confidence: number;
  mode: AlignmentMode;
  zoneStartIndex: number;
  zoneEndIndex: number;
  matchedPhrase: string;
}

export function normalizeWord(value: string): string {
  return value
    .toLowerCase()
    .replace(/[“”„"']/g, "")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .trim();
}

export function parseReferenceText(text: string): ReferenceWord[] {
  const segments = text.match(/\S+\s*/g) ?? [];
  const words: ReferenceWord[] = [];

  for (const segment of segments) {
    const normalized = normalizeWord(segment);
    if (!normalized) {
      continue;
    }

    words.push({
      index: words.length,
      display: segment,
      normalized,
    });
  }

  return words;
}

export function getTranscriptWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const nextDiagonal = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + cost,
      );
      diagonal = nextDiagonal;
    }
  }

  return previous[b.length];
}

function normalizePhoneticKey(value: string): string {
  return normalizeWord(value)
    .replace(/([a-zõäöüšž])\1+/g, "$1")
    .replace(/[bp]/g, "p")
    .replace(/[dt]/g, "t")
    .replace(/[gkqc]/g, "k")
    .replace(/[fvw]/g, "v")
    .replace(/[szšž]/g, "s")
    .replace(/[mn]/g, "n")
    .replace(/[õöüäaeiouy]/g, "a")
    .replace(/h/g, "")
    .replace(/j/g, "i");
}

function getWordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const normalizedA = normalizeWord(a);
  const normalizedB = normalizeWord(b);

  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;
  if (normalizedA.startsWith(normalizedB) || normalizedB.startsWith(normalizedA)) {
    return 0.92;
  }

  const spellingDistance = levenshteinDistance(normalizedA, normalizedB);
  const spellingLongest = Math.max(normalizedA.length, normalizedB.length);
  const spellingScore =
    spellingLongest === 0 ? 0 : clamp(1 - spellingDistance / spellingLongest, 0, 1);

  const phoneticA = normalizePhoneticKey(normalizedA);
  const phoneticB = normalizePhoneticKey(normalizedB);
  const phoneticDistance = levenshteinDistance(phoneticA, phoneticB);
  const phoneticLongest = Math.max(phoneticA.length, phoneticB.length, 1);
  const phoneticScore = clamp(1 - phoneticDistance / phoneticLongest, 0, 1);

  const boundaryBonus =
    normalizedA[0] === normalizedB[0] && normalizedA.at(-1) === normalizedB.at(-1)
      ? 0.05
      : 0;

  return clamp(
    Math.max(spellingScore, phoneticScore * 0.96, (spellingScore + phoneticScore) / 2) +
      boundaryBonus,
    0,
    1,
  );
}

function getReferenceSkipCost(word: string): number {
  if (LIGHTWEIGHT_WORDS.has(word)) {
    return 0.34;
  }

  if (word.length <= 3) {
    return 0.4;
  }

  return 0.68;
}

function getInsertionCost(word: string): number {
  if (word.length <= 2) {
    return 0.42;
  }

  return 0.74;
}

function getSubstitutionCost(transcriptWord: string, referenceWord: string): number {
  const similarity = getWordSimilarity(transcriptWord, referenceWord);

  if (similarity >= 0.97) return 0;
  if (similarity >= 0.9) return 0.14;
  if (similarity >= 0.8) return 0.3;
  if (similarity >= 0.68) return 0.48;
  if (similarity >= 0.56) return 0.66;

  return 1.05;
}

function getSentenceBoundedEnd(
  referenceWords: ReferenceWord[],
  start: number,
  maxLookahead: number,
): number {
  const hardEnd = Math.min(referenceWords.length, start + maxLookahead);
  const searchStart = Math.min(hardEnd, start + MIN_SENTENCE_WINDOW_WORDS);

  for (let index = searchStart; index < hardEnd; index += 1) {
    if (/[.!?;:]/.test(referenceWords[index]?.display ?? "")) {
      return index + 1;
    }
  }

  return hardEnd;
}

function getDefaultZoneEnd(referenceWords: ReferenceWord[], currentWordIndex: number): number {
  return Math.min(referenceWords.length, Math.max(currentWordIndex + 1, 1));
}

function backtrackCandidate(
  dp: number[][],
  trace: StepDirection[][],
  transcriptWindow: string[],
  referenceWindow: ReferenceWord[],
  previousState: AlignmentState,
  signalType: AlignmentSignal["type"],
  windowOffset: number,
  endJ: number,
  referenceLength: number,
): CandidateMetrics | null {
  let i = transcriptWindow.length;
  let j = endJ;

  const matchedIndices: number[] = [];
  const similarities: number[] = [];
  let fuzzyMatches = 0;
  let referenceSkips = 0;
  let transcriptInsertions = 0;

  while (i > 0 || j > 0) {
    const direction = trace[i]?.[j];
    if (!direction) {
      break;
    }

    if (direction === "diag") {
      if (i > 0 && j > 0) {
        const similarity = getWordSimilarity(
          transcriptWindow[i - 1],
          referenceWindow[j - 1].normalized,
        );
        if (similarity >= 0.56) {
          matchedIndices.push(j - 1);
          similarities.push(similarity);
          if (similarity < 0.9) {
            fuzzyMatches += 1;
          }
        }
      }
      i -= 1;
      j -= 1;
      continue;
    }

    if (direction === "left") {
      referenceSkips += 1;
      j -= 1;
      continue;
    }

    transcriptInsertions += 1;
    i -= 1;
  }

  if (matchedIndices.length === 0 || similarities.length === 0) {
    return null;
  }

  matchedIndices.reverse();
  similarities.reverse();

  const firstMatched = matchedIndices[0];
  const lastMatched = matchedIndices[matchedIndices.length - 1];
  const acceptedMatches = similarities.filter((value) => value >= 0.56).length;
  const averageSimilarity =
    similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
  const coverage = acceptedMatches / Math.max(1, transcriptWindow.length);
  const pathCost = dp[transcriptWindow.length][endJ];
  const pathScore = clamp(
    1 - pathCost / Math.max(2.4, transcriptWindow.length * 0.92 + 0.5),
    0,
    1,
  );

  const nextWordIndex = windowOffset + lastMatched + 1;
  const jump = nextWordIndex - previousState.currentWordIndex;
  const progressScore = clamp(jump / Math.max(1, transcriptWindow.length), 0, 1);
  let confidence =
    averageSimilarity * 0.46 + coverage * 0.28 + pathScore * 0.2 + progressScore * 0.06;

  confidence -= referenceSkips * 0.02;
  confidence -= transcriptInsertions * 0.025;
  confidence -= fuzzyMatches * 0.01;

  if (signalType === "final") {
    confidence += 0.04;
  }

  confidence = clamp(confidence, 0, 1);

  let mode: AlignmentMode = "lost";
  if (confidence >= 0.87 && fuzzyMatches === 0 && referenceSkips <= 1) {
    mode = "exact";
  } else if (confidence >= 0.72) {
    mode = "fuzzy";
  } else if (confidence >= 0.5) {
    mode = "uncertain";
  }

  const zoneStartIndex = clamp(
    windowOffset + Math.max(0, firstMatched - 1),
    0,
    referenceLength,
  );
  const zoneEndIndex = clamp(
    windowOffset + Math.min(referenceWindow.length, lastMatched + 2),
    1,
    referenceLength,
  );
  const matchedPhrase = referenceWindow
    .slice(firstMatched, lastMatched + 1)
    .map((word) => word.display.trim())
    .join(" ");

  return {
    nextWordIndex: clamp(nextWordIndex, 0, referenceLength),
    confidence,
    mode,
    zoneStartIndex,
    zoneEndIndex,
    matchedPhrase,
  };
}

export function alignTranscriptToReference(
  referenceWords: ReferenceWord[],
  transcriptText: string,
  previousState: AlignmentState,
  signal: AlignmentSignal = {},
): AlignmentState {
  const signalType = signal.type ?? "idle";
  const signalUtteranceId = signal.utteranceId ?? null;

  if (signalType === "reset") {
    return {
      ...INITIAL_ALIGNMENT_STATE,
      lastSignalType: signalType,
      lastUtteranceId: signalUtteranceId,
    };
  }

  if (referenceWords.length === 0) {
    return {
      ...INITIAL_ALIGNMENT_STATE,
      recentTranscript: transcriptText.trim(),
      lastSignalType: signalType,
      lastUtteranceId: signalUtteranceId,
    };
  }

  const transcriptWords = getTranscriptWords(transcriptText);
  if (transcriptWords.length === 0) {
    return {
      ...previousState,
      confidence: 0,
      recentTranscript: "",
      matchedPhrase: "",
      mode: "lost",
      zoneStartIndex: clamp(previousState.currentWordIndex, 0, referenceWords.length),
      zoneEndIndex: getDefaultZoneEnd(referenceWords, previousState.currentWordIndex),
      lastSignalType: signalType,
      lastUtteranceId: signalUtteranceId,
    };
  }

  const transcriptWindow = transcriptWords.slice(-TRANSCRIPT_WINDOW_WORDS);
  const currentAnchor = previousState.hasLock
    ? Math.max(0, previousState.currentWordIndex)
    : 0;
  const referenceStart = previousState.hasLock
    ? Math.max(0, Math.min(currentAnchor, previousState.zoneStartIndex) - SEARCH_BACKTRACK_WORDS)
    : 0;
  const referenceEnd = previousState.hasLock
    ? getSentenceBoundedEnd(referenceWords, currentAnchor, SEARCH_LOOKAHEAD_WORDS)
    : getSentenceBoundedEnd(referenceWords, 0, INITIAL_SEARCH_SPAN_WORDS);
  const referenceWindow = referenceWords.slice(referenceStart, referenceEnd);

  if (referenceWindow.length === 0) {
    return {
      ...previousState,
      confidence: 0,
      recentTranscript: transcriptWindow.join(" "),
      matchedPhrase: "",
      mode: "lost",
      zoneStartIndex: clamp(previousState.currentWordIndex, 0, referenceWords.length),
      zoneEndIndex: getDefaultZoneEnd(referenceWords, previousState.currentWordIndex),
      lastSignalType: signalType,
      lastUtteranceId: signalUtteranceId,
    };
  }

  const rows = transcriptWindow.length + 1;
  const cols = referenceWindow.length + 1;
  const dp = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Number.POSITIVE_INFINITY));
  const trace = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "diag" as StepDirection));

  dp[0][0] = 0;

  for (let j = 1; j < cols; j += 1) {
    dp[0][j] = dp[0][j - 1] + getReferenceSkipCost(referenceWindow[j - 1].normalized);
    trace[0][j] = "left";
  }

  for (let i = 1; i < rows; i += 1) {
    dp[i][0] = dp[i - 1][0] + getInsertionCost(transcriptWindow[i - 1]);
    trace[i][0] = "up";

    for (let j = 1; j < cols; j += 1) {
      const diagCost =
        dp[i - 1][j - 1] +
        getSubstitutionCost(transcriptWindow[i - 1], referenceWindow[j - 1].normalized);
      const leftCost = dp[i][j - 1] + getReferenceSkipCost(referenceWindow[j - 1].normalized);
      const upCost = dp[i - 1][j] + getInsertionCost(transcriptWindow[i - 1]);

      let bestCost = diagCost;
      let bestDirection: StepDirection = "diag";

      if (leftCost < bestCost) {
        bestCost = leftCost;
        bestDirection = "left";
      }

      if (upCost < bestCost) {
        bestCost = upCost;
        bestDirection = "up";
      }

      dp[i][j] = bestCost;
      trace[i][j] = bestDirection;
    }
  }

  let bestCandidate: CandidateMetrics | null = null;

  for (let endJ = 1; endJ < cols; endJ += 1) {
    const candidate = backtrackCandidate(
      dp,
      trace,
      transcriptWindow,
      referenceWindow,
      previousState,
      signalType,
      referenceStart,
      endJ,
      referenceWords.length,
    );

    if (!candidate) {
      continue;
    }

    const jump = candidate.nextWordIndex - previousState.currentWordIndex;
    const candidateScore =
      candidate.confidence +
      Math.min(0.08, Math.max(0, jump) * 0.012) -
      Math.max(0, jump - 8) * 0.012;

    const currentBestScore =
      bestCandidate === null
        ? Number.NEGATIVE_INFINITY
        : bestCandidate.confidence +
          Math.min(0.08, Math.max(0, bestCandidate.nextWordIndex - previousState.currentWordIndex) * 0.012) -
          Math.max(0, bestCandidate.nextWordIndex - previousState.currentWordIndex - 8) * 0.012;

    if (candidateScore > currentBestScore) {
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate) {
    return {
      ...previousState,
      confidence: 0,
      recentTranscript: transcriptWindow.join(" "),
      matchedPhrase: "",
      mode: "lost",
      zoneStartIndex: clamp(previousState.currentWordIndex, 0, referenceWords.length),
      zoneEndIndex: getDefaultZoneEnd(referenceWords, previousState.currentWordIndex),
      lastSignalType: signalType,
      lastUtteranceId: signalUtteranceId,
    };
  }

  const jump = bestCandidate.nextWordIndex - previousState.currentWordIndex;
  const canAdvanceExact =
    bestCandidate.mode === "exact" && bestCandidate.confidence >= 0.78;
  const canAdvanceFuzzy =
    bestCandidate.mode === "fuzzy" &&
    ((signalType === "final" && bestCandidate.confidence >= 0.66) ||
      (signalType !== "final" && bestCandidate.confidence >= 0.73));
  const canAdvanceUncertain =
    bestCandidate.mode === "uncertain" &&
    jump <= 2 &&
    ((signalType === "final" && bestCandidate.confidence >= 0.58) ||
      (signalType !== "final" && bestCandidate.confidence >= 0.66));
  const shouldAdvance =
    jump >= 0 &&
    (canAdvanceExact || canAdvanceFuzzy || canAdvanceUncertain);

  const nextWordIndex = shouldAdvance
    ? bestCandidate.nextWordIndex
    : previousState.currentWordIndex;
  const zoneStartIndex = shouldAdvance
    ? bestCandidate.zoneStartIndex
    : Math.min(bestCandidate.zoneStartIndex, nextWordIndex);
  const zoneEndIndex = shouldAdvance
    ? bestCandidate.zoneEndIndex
    : Math.max(
        bestCandidate.zoneEndIndex,
        getDefaultZoneEnd(referenceWords, nextWordIndex),
      );

  return {
    currentWordIndex: clamp(nextWordIndex, 0, referenceWords.length),
    confidence: bestCandidate.confidence,
    recentTranscript: transcriptWindow.join(" "),
    matchedPhrase: bestCandidate.matchedPhrase,
    hasLock: previousState.hasLock || shouldAdvance,
    lastSignalType: signalType,
    lastUtteranceId: signalUtteranceId,
    mode: shouldAdvance ? bestCandidate.mode : bestCandidate.confidence >= 0.5 ? "uncertain" : "lost",
    zoneStartIndex: clamp(zoneStartIndex, 0, referenceWords.length),
    zoneEndIndex: clamp(zoneEndIndex, 1, referenceWords.length),
  };
}
