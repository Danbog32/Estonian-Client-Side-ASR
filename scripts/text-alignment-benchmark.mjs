#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const DEFAULT_DATASET_ROOT = "/Users/pb096/Downloads/OneDrive_1_6-29-2026";
const DEFAULT_BENCHMARK_DIR = "benchmarks/text-alignment";
const SAMPLE_INTERVAL_SEC = 0.1;
const STUCK_THRESHOLD_SEC = 1;
const require = createRequire(import.meta.url);
let alignmentApiCache = null;

function loadAlignmentApi() {
  if (alignmentApiCache) {
    return alignmentApiCache;
  }

  const ts = require("typescript");
  const source = fs.readFileSync("app/text-alignment/alignment.ts", "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require,
  });
  alignmentApiCache = module.exports;
  return alignmentApiCache;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      args._.push(value);
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function normalizeWord(value) {
  return value
    .toLowerCase()
    .replace(/[“”„"']/g, "")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .trim();
}

function normalizeText(value) {
  return value
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)
    .join(" ");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function readCsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function writeCsv(filePath, rows) {
  if (rows.length === 0) {
    fs.writeFileSync(filePath, "");
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function walkFiles(rootPath) {
  const result = [];
  const stack = [rootPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  return result.sort();
}

function getBaseId(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function parseSpeakerMetadata(id) {
  const parts = id.split("_");
  return {
    participant: parts[0] ?? "",
    gender: parts[1] ?? "",
    age: parts[2] ?? "",
  };
}

function discoverDataset(args) {
  const datasetRoot = args.dataset ?? DEFAULT_DATASET_ROOT;
  const benchmarkDir = args.out ?? DEFAULT_BENCHMARK_DIR;
  ensureDir(benchmarkDir);

  const files = walkFiles(datasetRoot);
  const byBase = new Map();

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (![".wav", ".txt", ".textgrid"].includes(ext)) {
      continue;
    }

    const base = getBaseId(filePath);
    const entry = byBase.get(base) ?? {};
    if (ext === ".wav") entry.audio_path = filePath;
    if (ext === ".txt") entry.reference_path = filePath;
    if (ext === ".textgrid") entry.textgrid_path = filePath;
    byBase.set(base, entry);
  }

  const rows = [];
  for (const [id, entry] of [...byBase.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!entry.audio_path || !entry.reference_path) {
      continue;
    }

    const referenceText = readText(entry.reference_path);
    const metadata = parseSpeakerMetadata(id);
    rows.push({
      id,
      audio_path: entry.audio_path,
      reference_path: entry.reference_path,
      textgrid_path: entry.textgrid_path ?? "",
      reference_text: referenceText,
      normalized_reference: normalizeText(referenceText),
      speaker_group: metadata.age ? `age_${metadata.age}` : "",
      gender: metadata.gender,
      notes: entry.textgrid_path ? "TextGrid available; review before final use" : "Missing TextGrid",
    });
  }

  const manifestPath = path.join(benchmarkDir, "dataset.csv");
  writeCsv(manifestPath, rows);
  console.log(`Discovered ${rows.length} benchmark items`);
  console.log(`Wrote ${manifestPath}`);
}

function parseTextGridWords(textGridText) {
  const wordsTierMatch = textGridText.match(/name = "words"[\s\S]*?(?=\n\titem \[\d+\]:|\n\s*$)/);
  const tierText = wordsTierMatch?.[0] ?? textGridText;
  const intervalRegex = /intervals \[\d+\]:\s+xmin = ([\d.]+)\s+xmax = ([\d.]+)\s+text = "(.*?)"/g;
  const intervals = [];
  let match;

  while ((match = intervalRegex.exec(tierText)) !== null) {
    const startSec = Number(match[1]);
    const endSec = Number(match[2]);
    const rawWord = match[3].trim();
    const word = normalizeWord(rawWord);

    if (!word || rawWord.startsWith("<")) {
      continue;
    }

    intervals.push({
      index: intervals.length,
      word,
      rawWord,
      startSec,
      endSec,
    });
  }

  return intervals;
}

function createGroundTruth(args) {
  const benchmarkDir = args.benchmark ?? DEFAULT_BENCHMARK_DIR;
  const manifestPath = args.manifest ?? path.join(benchmarkDir, "dataset.csv");
  const outDir = args.out ?? path.join(benchmarkDir, "ground-truth");
  ensureDir(outDir);

  const rows = readCsv(manifestPath);
  let written = 0;
  let missing = 0;

  for (const row of rows) {
    if (!row.textgrid_path || !fs.existsSync(row.textgrid_path)) {
      missing += 1;
      continue;
    }

    const words = parseTextGridWords(readText(row.textgrid_path));
    const payload = {
      id: row.id,
      audioPath: row.audio_path,
      referencePath: row.reference_path,
      textGridPath: row.textgrid_path,
      referenceText: row.reference_text,
      normalizedReference: row.normalized_reference,
      reviewStatus: "draft_from_textgrid",
      words,
    };

    fs.writeFileSync(path.join(outDir, `${row.id}.json`), `${JSON.stringify(payload, null, 2)}\n`);
    written += 1;
  }

  console.log(`Wrote ${written} ground-truth drafts to ${outDir}`);
  if (missing > 0) console.log(`Skipped ${missing} rows without TextGrid`);
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findGroundTruthWord(words, timeSec) {
  return words.find((word) => timeSec >= word.startSec && timeSec < word.endSec) ?? null;
}

function findPrediction(records, timeSec) {
  let candidate = null;
  for (const record of records) {
    if (typeof record.timeSec !== "number") continue;
    if (record.timeSec <= timeSec) {
      candidate = record;
    } else {
      break;
    }
  }
  return candidate;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function isReliablePrediction(record) {
  return (
    record &&
    record.mode !== "lost" &&
    typeof record.predictedWordIndex === "number"
  );
}

function computeTransitionDelays(words, records) {
  const delays = [];
  for (const word of words.slice(1)) {
    const transition = records.find(
      (record) =>
        isReliablePrediction(record) &&
        record.timeSec >= word.startSec &&
        record.predictedWordIndex >= word.index,
    );
    if (transition) {
      delays.push(Math.max(0, transition.timeSec - word.startSec));
    }
  }
  return delays;
}

function evaluateOne(groundTruth, prediction) {
  const records = (prediction.records ?? [])
    .filter((record) => typeof record.timeSec === "number")
    .sort((a, b) => a.timeSec - b.timeSec);
  const words = groundTruth.words ?? [];
  const durationSec = Math.max(...words.map((word) => word.endSec), 0);

  let samples = 0;
  let exact = 0;
  let withinOne = 0;
  let absoluteErrorSum = 0;
  let falseJumps = 0;
  let noLock = 0;
  let stuckTimeSec = 0;
  let currentStuckRun = 0;

  for (let timeSec = 0; timeSec <= durationSec; timeSec += SAMPLE_INTERVAL_SEC) {
    const truth = findGroundTruthWord(words, timeSec);
    if (!truth) continue;

    samples += 1;
    const pred = findPrediction(records, timeSec);
    if (!isReliablePrediction(pred)) {
      noLock += 1;
      currentStuckRun = 0;
      continue;
    }

    const error = pred.predictedWordIndex - truth.index;
    const absError = Math.abs(error);
    absoluteErrorSum += absError;
    if (absError === 0) exact += 1;
    if (absError <= 1) withinOne += 1;
    if (absError > 2) falseJumps += 1;

    if (error < -1) {
      currentStuckRun += SAMPLE_INTERVAL_SEC;
      if (currentStuckRun >= STUCK_THRESHOLD_SEC) {
        stuckTimeSec += SAMPLE_INTERVAL_SEC;
      }
    } else {
      currentStuckRun = 0;
    }
  }

  const delays = computeTransitionDelays(words, records);
  return {
    id: groundTruth.id,
    audioPath: groundTruth.audioPath,
    sampleCount: samples,
    durationSec,
    exactAccuracy: samples ? exact / samples : 0,
    withinOneAccuracy: samples ? withinOne / samples : 0,
    meanAbsoluteWordError: samples ? absoluteErrorSum / samples : null,
    medianDelaySec: median(delays),
    falseJumps,
    falseJumpsPerMinute: durationSec > 0 ? falseJumps / (durationSec / 60) : 0,
    stuckTimeSec,
    stuckTimeRatio: durationSec > 0 ? stuckTimeSec / durationSec : 0,
    noLockRatio: samples ? noLock / samples : 0,
  };
}

function generateOraclePredictions(args) {
  const benchmarkDir = args.benchmark ?? DEFAULT_BENCHMARK_DIR;
  const groundTruthDir = args.groundTruth ?? path.join(benchmarkDir, "ground-truth");
  const outDir = args.out ?? path.join(benchmarkDir, "predictions-oracle");
  const recognitionPoint = Number(args.recognitionPoint ?? 0.5);
  const signalType = args.signalType === "partial" ? "partial" : "final";
  ensureDir(outDir);

  const {
    INITIAL_ALIGNMENT_STATE,
    alignTranscriptToReference,
    parseReferenceText,
  } = loadAlignmentApi();

  const groundTruthFiles = fs.existsSync(groundTruthDir)
    ? fs.readdirSync(groundTruthDir).filter((name) => name.endsWith(".json"))
    : [];

  let written = 0;
  for (const fileName of groundTruthFiles) {
    const groundTruth = loadJson(path.join(groundTruthDir, fileName));
    const referenceWords = parseReferenceText(groundTruth.referenceText ?? groundTruth.normalizedReference ?? "");
    const words = groundTruth.words ?? [];
    const durationSec = Math.max(...words.map((word) => word.endSec), 0);
    let alignmentState = INITIAL_ALIGNMENT_STATE;
    let lastTranscript = "";
    const records = [];

    for (let timeSec = 0; timeSec <= durationSec + SAMPLE_INTERVAL_SEC / 2; timeSec += SAMPLE_INTERVAL_SEC) {
      const transcriptWords = words
        .filter((word) => {
          const availableAt = word.startSec + (word.endSec - word.startSec) * recognitionPoint;
          return availableAt <= timeSec;
        })
        .map((word) => word.word);
      const transcript = transcriptWords.join(" ");

      if (transcript !== lastTranscript || records.length === 0) {
        alignmentState = alignTranscriptToReference(
          referenceWords,
          transcript,
          alignmentState,
          { type: signalType, utteranceId: groundTruth.id },
        );
        lastTranscript = transcript;
      }

      records.push({
        timeSec: Math.round(timeSec * 10) / 10,
        predictedWordIndex: alignmentState.currentWordIndex,
        confidence: alignmentState.confidence,
        matchedPhrase: alignmentState.matchedPhrase,
        asrText: transcript,
        mode: alignmentState.mode,
        sourceType: "oracle-textgrid",
      });
    }

    const payload = {
      id: groundTruth.id,
      source: "oracle-textgrid",
      recognitionPoint,
      signalType,
      records,
    };
    fs.writeFileSync(path.join(outDir, fileName), JSON.stringify(payload, null, 2) + "\n");
    written += 1;
  }

  console.log(`Wrote ${written} oracle prediction logs to ${outDir}`);
  console.log(`Recognition point: ${recognitionPoint}; signal type: ${signalType}`);
}

function evaluate(args) {  const benchmarkDir = args.benchmark ?? DEFAULT_BENCHMARK_DIR;
  const groundTruthDir = args.groundTruth ?? path.join(benchmarkDir, "ground-truth");
  const predictionsDir = args.predictions ?? path.join(benchmarkDir, "predictions");
  const resultsDir = args.out ?? path.join(benchmarkDir, "results");
  ensureDir(resultsDir);

  const groundTruthFiles = fs.existsSync(groundTruthDir)
    ? fs.readdirSync(groundTruthDir).filter((name) => name.endsWith(".json"))
    : [];

  const results = [];
  const missingPredictions = [];

  for (const fileName of groundTruthFiles) {
    const groundTruth = loadJson(path.join(groundTruthDir, fileName));
    const predictionPath = path.join(predictionsDir, fileName);
    if (!fs.existsSync(predictionPath)) {
      missingPredictions.push(groundTruth.id);
      continue;
    }

    const prediction = loadJson(predictionPath);
    results.push(evaluateOne(groundTruth, prediction));
  }

  const aggregate = aggregateResults(results);
  const payload = {
    generatedAt: new Date().toISOString(),
    sampleIntervalSec: SAMPLE_INTERVAL_SEC,
    results,
    aggregate,
    missingPredictions,
  };

  fs.writeFileSync(path.join(resultsDir, "results.json"), `${JSON.stringify(payload, null, 2)}\n`);
  writeCsv(path.join(resultsDir, "summary.csv"), results.map(formatResultRow));
  writeReport(path.join(resultsDir, "report.html"), payload);

  console.log(`Evaluated ${results.length} recordings`);
  if (missingPredictions.length > 0) {
    console.log(`Missing prediction logs: ${missingPredictions.length}`);
  }
  console.log(`Wrote ${resultsDir}/results.json, summary.csv, report.html`);
}

function aggregateResults(results) {
  if (results.length === 0) {
    return {
      recordings: 0,
      exactAccuracy: 0,
      withinOneAccuracy: 0,
      meanAbsoluteWordError: null,
      medianDelaySec: null,
      falseJumpsPerMinute: 0,
      stuckTimeRatio: 0,
      noLockRatio: 0,
    };
  }

  const totalDuration = results.reduce((sum, result) => sum + result.durationSec, 0);
  const weighted = (field) =>
    totalDuration
      ? results.reduce((sum, result) => sum + result[field] * result.durationSec, 0) / totalDuration
      : 0;

  return {
    recordings: results.length,
    exactAccuracy: weighted("exactAccuracy"),
    withinOneAccuracy: weighted("withinOneAccuracy"),
    meanAbsoluteWordError:
      results.reduce((sum, result) => sum + (result.meanAbsoluteWordError ?? 0), 0) /
      results.length,
    medianDelaySec: median(results.map((result) => result.medianDelaySec).filter((v) => v !== null)),
    falseJumpsPerMinute: weighted("falseJumpsPerMinute"),
    stuckTimeRatio: weighted("stuckTimeRatio"),
    noLockRatio: weighted("noLockRatio"),
  };
}

function pct(value) {
  return `${Math.round((value ?? 0) * 1000) / 10}%`;
}

function seconds(value) {
  return value === null || value === undefined ? "" : String(Math.round(value * 1000) / 1000);
}

function formatResultRow(result) {
  return {
    id: result.id,
    exact_accuracy: pct(result.exactAccuracy),
    within_one_accuracy: pct(result.withinOneAccuracy),
    mean_absolute_word_error: seconds(result.meanAbsoluteWordError),
    median_delay_sec: seconds(result.medianDelaySec),
    false_jumps: result.falseJumps,
    false_jumps_per_minute: seconds(result.falseJumpsPerMinute),
    stuck_time_percent: pct(result.stuckTimeRatio),
    no_lock_percent: pct(result.noLockRatio),
    duration_sec: seconds(result.durationSec),
  };
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeReport(filePath, payload) {
  const rows = payload.results
    .map(
      (result) => `<tr>
        <td>${htmlEscape(result.id)}</td>
        <td>${pct(result.exactAccuracy)}</td>
        <td>${pct(result.withinOneAccuracy)}</td>
        <td>${seconds(result.medianDelaySec)}</td>
        <td>${result.falseJumps}</td>
        <td>${pct(result.stuckTimeRatio)}</td>
        <td>${pct(result.noLockRatio)}</td>
      </tr>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Text Alignment Benchmark Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #17202a; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
    .card { border: 1px solid #d7dee8; border-radius: 14px; padding: 16px; background: #f8fafc; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    .value { font-size: 28px; font-weight: 700; margin-top: 8px; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
  </style>
</head>
<body>
  <h1>Text Alignment Benchmark Report</h1>
  <p>Generated at ${htmlEscape(payload.generatedAt)}. Sample interval: ${payload.sampleIntervalSec}s.</p>
  <div class="cards">
    <div class="card"><div class="label">Recordings</div><div class="value">${payload.aggregate.recordings}</div></div>
    <div class="card"><div class="label">Exact accuracy</div><div class="value">${pct(payload.aggregate.exactAccuracy)}</div></div>
    <div class="card"><div class="label">±1 accuracy</div><div class="value">${pct(payload.aggregate.withinOneAccuracy)}</div></div>
    <div class="card"><div class="label">Median delay</div><div class="value">${seconds(payload.aggregate.medianDelaySec)}s</div></div>
    <div class="card"><div class="label">False jumps/min</div><div class="value">${seconds(payload.aggregate.falseJumpsPerMinute)}</div></div>
    <div class="card"><div class="label">Stuck time</div><div class="value">${pct(payload.aggregate.stuckTimeRatio)}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Exact</th>
        <th>±1</th>
        <th>Delay sec</th>
        <th>False jumps</th>
        <th>Stuck</th>
        <th>No lock</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  fs.writeFileSync(filePath, html);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0] ?? "help";

if (command === "discover") {
  discoverDataset(args);
} else if (command === "ground-truth") {
  createGroundTruth(args);
} else if (command === "oracle-predictions") {
  generateOraclePredictions(args);
} else if (command === "evaluate") {
  evaluate(args);
} else {
  console.log(`Text alignment benchmark

Commands:
  discover      Generate dataset.csv from wav/txt/TextGrid files
  ground-truth  Convert TextGrid word tier to ground-truth JSON
  oracle-predictions  Generate upper-bound predictions from TextGrid words
  evaluate      Compare prediction logs with ground truth and generate reports

Examples:
  npm run benchmark:text-alignment:discover -- --dataset /Users/pb096/Downloads/OneDrive_1_6-29-2026
  npm run benchmark:text-alignment:ground-truth
  npm run benchmark:text-alignment:oracle-predictions
  npm run benchmark:text-alignment:evaluate -- --predictions benchmarks/text-alignment/predictions-oracle
`);
}
