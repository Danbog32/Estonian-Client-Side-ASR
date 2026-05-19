# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint via Next.js
```

No test suite exists. Testing ASR functionality is done manually using components in `asr-testing/` pages.

## Architecture Overview

**Eesti ASR** is a Next.js (App Router) browser-based speech-to-text app for Estonian. The core ASR pipeline runs entirely in-browser via ONNX/WASM — no audio ever leaves the device. Optional external services (translation, Firebase, Zoom) are user-toggled.

### ASR Pipeline

The browser-side ASR stack is entirely in `public/onnx/` (plain JS, not bundled by Next.js):

1. **`sherpa-onnx-wasm-main-asr-v2`** (.js/.wasm/.data) — Sherpa-ONNX WASM model for speech recognition
2. **`sherpa-onnx-vad`** (.js/.wasm/.data) — Voice Activity Detection model
3. **`asr-worker.js`** / **`vad-worker.js`** — Web Workers offloading computation off the main thread
4. **`audio-worklet-processor.js`** — AudioWorklet for low-latency audio capture
5. **`app-asr.js`** — Orchestrates the above; emits `modelInitialized` and `transcriptUpdate` window events

Scripts must load in order: `sherpa-onnx-asr.js` → `app-asr.js` → `sherpa-onnx-wasm-main-asr-v2.js`. Loading is handled by `AsrScriptBridge.tsx` using Next.js `<Script strategy="afterInteractive">`.

**WASM threading requires** `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` — set in `next.config.mjs`.

### Event-Driven Communication

React components communicate with the ONNX layer via window events:
- `modelInitialized` — fired when the ASR model is ready
- `transcriptUpdate` — fired with `{ blocks: TranscriptBlock[] }` detail on each new utterance

Asr.tsx listens to these events; mic control happens by imperatively clicking hidden buttons (`startBtn`, `stopBtn`, `clearBtn`) that `app-asr.js` binds to.

### Global State

`app/providers/SettingsContext.tsx` holds all user preferences in localStorage (schema v3). Key settings: `fontSizePx`, `lineHeight`, `language` (`"en" | "et"`), `textColor`, `backgroundColor`, `firebaseEnabled`, `zoomEnabled`, `translationEnabled`. Access via `useSettings()`.

### Routing

- `/` — Main ASR page (Asr.tsx + AsrScriptBridge.tsx)
- `/[captionName]` — Read-only caption viewer for multi-device sharing
- `/text-alignment` — Experimental: align live speech to a reference text using Levenshtein + phonetic matching (`app/text-alignment/alignment.ts`)

### API Routes

- `POST /api/translate` — Estonian→English translation via LLM (HuggingFace-compatible). Maintains a per-session context window (up to 100 messages). `GET` = health check, `DELETE` = reset session.
- `POST /api/zoom/caption` — Proxy to Zoom closed-captions API; tracks sequence number per request.

## Key Patterns

**Translations** — defined inline per-component with `en`/`et` fallback:
```typescript
const translations = { en: { key: "text" }, et: { key: "tekst" } };
const text = translations[language]?.key || translations.en.key;
```

**Full-height containers** — use `h-[calc(100vh-108px)]` to account for the fixed header height.

**Auto-scroll** — `useAutoScroll` hook handles smart scroll-to-bottom with a 200px threshold; use it for any scrollable transcript view.

**TypeScript** — `next.config.mjs` has `typescript.ignoreBuildErrors: true`, so type errors won't fail builds. Prefer TypeScript for new files; avoid `any`.

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase config (Firestore for multi-device caption sharing)
- `HF_TRANSLATE_API_BASE`, `HF_TRANSLATE_API_KEY`, `HF_TRANSLATE_MODEL` — Translation LLM endpoint
