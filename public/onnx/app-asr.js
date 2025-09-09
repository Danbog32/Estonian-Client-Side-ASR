// This file copies and modifies code
// from https://mdn.github.io/web-dictaphone/scripts/app.js
// and https://gist.github.com/meziantou/edb7217fddfbb70e899e

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const hint = document.getElementById("hint");
const soundClips = document.getElementById("sound-clips");
const toggleBtn = document.getElementById("toggleBtn");

if (!startBtn) {
  console.error("Start button not found!");
}
// let textArea = document.getElementById("results");

// Instead of writing to a textarea, update the inner text of the transcript span
const transcriptElement = document.getElementById("transcriptText");

if (!transcriptElement) {
  console.error("Transcript element not found!");
}

// Add these at the top of app-asr.js
let subtitleMode = false; // Default to false for text mode
const maxWords = 24; // Maximum number of words to display
const minSentenceLength = 8; // Minimum words in a sentence before it is considered complete

// Variables for API settings
let apiToken = ""; // Store API token from the settings

// Function to update subtitle mode
function setSubtitleMode(mode) {
  subtitleMode = mode;
}
window.setSubtitleMode = setSubtitleMode;

let lastSentCaption = ""; // Variable to store the last caption sent to the API

let sendToZoomEnabled = false; // Whether sending to Zoom is enabled

// Function to set Zoom settings (called from Settings)
window.setZoomSettings = function (enabled, token) {
  sendToZoomEnabled = enabled;
  apiToken = token; // Assuming the token is set here
};

async function sendCaptionToZoom(captionText) {
  if (!sendToZoomEnabled || !apiToken) {
    return;
  }

  try {
    // Adjust the endpoint as per your Zoom API setup
    const response = await fetch("/api/zoom/caption", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        captionText,
        lang: "en-US",
        zoomTokenUrl: apiToken,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`Caption sent to Zoom successfully with seq: ${data.seq}`);
    } else {
      console.error(`Error sending caption to Zoom: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to send caption to Zoom:", error);
  }
}

let captionEnabled = false; // Whether the feature is enabled
let captionName = ""; // The name of the caption session

// Function to set caption settings (called from Settings)
window.setCaptionSettings = function (enabled) {
  captionEnabled = enabled;
  if (!enabled) {
    captionName = ""; // Reset caption name when disabled
  }
};

let firebaseEnabled = false; // Whether Firebase is enabled
let streamingCaptionsUrl = ""; // The name of the caption session

window.setFirebaseSettings = function (enabled, name) {
  firebaseEnabled = enabled;
  streamingCaptionsUrl = name;
};

// Translation server settings (Option B: WebAssembly ASR + Server Translation)
let translationEnabled = false; // Whether translation is enabled
let translationServerUrl = "/api/translate"; // Translation server URL
let sessionId = `session-${Math.random().toString(36).substr(2, 9)}`; // Unique session ID
let sentTranslations = new Set(); // Track sent translations to prevent duplicates
let lastSentText = ""; // Track last sent text to avoid duplicates

// Function to set translation settings (called from Settings)
window.setTranslationSettings = function (
  enabled,
  serverUrl = "/api/translate"
) {
  translationEnabled = enabled;
  translationServerUrl = serverUrl;
  console.log(
    `Translation ${enabled ? "enabled" : "disabled"} - Server: ${serverUrl}`
  );
};

// WebSocket ASR integration (remote server)
const WS_ASR_URL = "wss://tekstiks.ee/asr/ws/asr";
let useWebSocketAsr = false; // When true, route audio to remote ASR over WebSocket
let wsAsr = null; // WebSocket instance
let wsAsrReady = false; // Connection open
let wsStreamActive = false; // Start event sent and stream active

function wsAsrSendJson(obj) {
  try {
    if (wsAsr && wsAsrReady) {
      wsAsr.send(JSON.stringify(obj));
    }
  } catch (e) {
    console.warn("WS ASR send failed", e);
  }
}

function startWsStreamIfNeeded() {
  if (wsAsr && wsAsrReady && !wsStreamActive) {
    wsAsrSendJson({ event: "start" });
    // Optionally pass config
    wsAsrSendJson({ event: "config", n_best: 1 });
    wsStreamActive = true;
  }
}

function initWebSocketAsr() {
  if (wsAsr) return; // already created
  try {
    wsAsr = new WebSocket(WS_ASR_URL);
    wsAsr.binaryType = "arraybuffer";

    wsAsr.onopen = () => {
      wsAsrReady = true;
      // Start a new stream upon connect
      startWsStreamIfNeeded();
      console.log("WS ASR connected");
    };

    wsAsr.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.error) {
          console.error("WS ASR error:", message.error);
          // If server reports no active stream, mark inactive and try to start a new one
          if (
            typeof message.error === "string" &&
            message.error.toLowerCase().includes("no active stream")
          ) {
            wsStreamActive = false;
            startWsStreamIfNeeded();
          }
          return;
        }
        if (message.event === "stream_started") {
          wsStreamActive = true;
          return;
        }
        if (message.event === "stream_ended") {
          wsStreamActive = false;
          return;
        }
        if (message.event === "flushing") {
          return;
        }
        if (message.event === "flush_complete") {
          const alt = Array.isArray(message.alternatives)
            ? message.alternatives[0]
            : null;
          const finalText = alt && alt.text ? alt.text : message.text || "";
          if (finalText) handleFinalResult(finalText);
          return;
        }
        if (message.event === "connection_closed") {
          return;
        }
        // Generic final payload
        if (message.is_final) {
          const alt = Array.isArray(message.alternatives)
            ? message.alternatives[0]
            : null;
          const finalText = alt && alt.text ? alt.text : message.text || "";
          if (finalText) handleFinalResult(finalText);
        } else if (typeof message.text === "string") {
          handlePartialResult(message.text);
        }
      } catch (e) {
        console.warn("WS ASR message parse failed", e);
      }
    };

    wsAsr.onclose = () => {
      wsAsrReady = false;
      wsStreamActive = false;
      wsAsr = null;
      console.log("WS ASR disconnected");
    };

    wsAsr.onerror = (e) => {
      console.error("WS ASR socket error", e);
    };
  } catch (e) {
    console.error("Failed to init WS ASR", e);
  }
}

function teardownWebSocketAsr(graceful = true) {
  try {
    if (wsAsr) {
      if (graceful && wsAsrReady) {
        // Try to end stream and close cleanly
        wsAsrSendJson({ event: "end" });
        wsAsrSendJson({ event: "close" });
      }
      try {
        wsAsr.close();
      } catch (_) {}
    }
  } finally {
    wsAsr = null;
    wsAsrReady = false;
    wsStreamActive = false;
  }
}

// Tie ASR mode to translation toggle per requirement
const originalSetTranslationSettings = window.setTranslationSettings;
window.setTranslationSettings = function (
  enabled,
  serverUrl = "/api/translate"
) {
  // Always update internal translation flags
  originalSetTranslationSettings(enabled, serverUrl);

  // Prevent redundant toggles from causing audio graph resets
  const desiredWsMode = !!enabled;
  if (useWebSocketAsr === desiredWsMode) {
    return;
  }

  useWebSocketAsr = desiredWsMode;

  if (useWebSocketAsr) {
    // Pause local worker processing while in WS mode
    try {
      asrWorker?.postMessage({ type: "pause" });
    } catch (_) {}
    initWebSocketAsr();
  } else {
    // Resume local worker when leaving WS mode
    try {
      asrWorker?.postMessage({ type: "resume" });
    } catch (_) {}
    teardownWebSocketAsr(true);
  }

  // If recording graph is active, reinitialize recorder to align SAB/port path
  if (isGraphConnected) {
    reinitializeRecorderForCurrentMode();
  }
};

// Ensure clean shutdown
window.addEventListener("beforeunload", () => {
  teardownWebSocketAsr(true);
});

// Function to reset translation session (called from Settings or when stuck)
window.resetTranslationSession = async function () {
  if (!translationEnabled) {
    console.log("Translation not enabled");
    return;
  }

  try {
    const response = await fetch(
      `${translationServerUrl}?session_id=${sessionId}`,
      { method: "DELETE" }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`🔄 Translation session reset: ${data.message}`);
      // Generate new session ID
      sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆕 New session ID: ${sessionId}`);
    } else {
      console.error("Failed to reset translation session");
    }
  } catch (error) {
    console.error("Error resetting translation session:", error);
  }
};

// Function to send text to translation server
async function sendTextToTranslationServer(text, isPartial = false) {
  if (!translationEnabled || !text.trim()) {
    return;
  }

  // Filter out very short fragments to avoid polluting translation context
  const cleanedText = text.trim();
  const wordCount = cleanedText.split(/\s+/).length;

  // For real-time translation: send if we have at least 5 words or it's an endpoint
  if (wordCount < 5 && isPartial && !cleanedText.match(/[.!?]$/)) {
    console.log(
      `⏭️ Skipping short fragment for translation: "${cleanedText}" (${wordCount} words)`
    );
    return;
  }

  // Check if we've already sent this text for translation to prevent duplicates
  if (sentTranslations.has(cleanedText)) {
    console.log(
      `🔄 Skipping duplicate translation request: "${cleanedText.substring(0, 50)}..."`
    );
    return;
  }

  // Also check if we've sent a very similar text (to catch minor variations)
  const similarText = Array.from(sentTranslations).find((sent) => {
    // If the texts are very similar (one contains the other and difference is small)
    const longer = sent.length > cleanedText.length ? sent : cleanedText;
    const shorter = sent.length > cleanedText.length ? cleanedText : sent;
    return longer.includes(shorter) && longer.length - shorter.length < 10;
  });

  if (similarText) {
    console.log(
      `🔄 Skipping similar translation request: "${cleanedText.substring(0, 50)}..." (similar to: "${similarText.substring(0, 30)}...")`
    );
    return;
  }

  // Mark this text as sent
  sentTranslations.add(cleanedText);
  console.log(
    `📤 Sending new translation request: "${cleanedText}" (${wordCount} words)`
  );

  // UI will append incoming translations into a single accumulated block

  try {
    const response = await fetch(translationServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanedText,
        session_id: sessionId,
        is_partial: isPartial,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        `✅ Translation sent: "${cleanedText}" (${wordCount} words) → "${data.translated_text}"`
      );
      console.log(`🔄 Server response:`, data);

      // Notify UI to append translation into the single accumulated block
      if (data.translated_text) {
        const translationUpdateEvent = new CustomEvent("translationUpdate", {
          detail: {
            originalText: data.original_text || cleanedText,
            translatedText: data.translated_text,
            status: data.is_partial ? "partial" : "completed",
            isPartial: data.is_partial || false,
          },
        });
        window.dispatchEvent(translationUpdateEvent);
        // console.log(
        //   `🌐 Appended translation to single block: "${data.translated_text}" (${data.is_partial ? "partial" : "complete"})`
        // );
      }
    } else {
      const errorData = await response.json();

      // Error handling - just show status, no block creation needed

      if (response.status === 503 && errorData.status === "starting_up") {
        console.log(`⏰ Translation service starting up: ${errorData.error}`);
        // Show user-friendly message that service is starting
        showTranslationStatus(
          "Service is starting up, please wait about 1 minute..."
        );
      } else {
        console.error(
          `❌ Translation failed: ${response.status} - ${errorData.error}`
        );
        showTranslationStatus(`Translation failed: ${errorData.error}`);
      }
    }
  } catch (error) {
    console.error("🚫 Failed to send text to translation server:", error);

    // Error handling - just show status, no block creation needed

    showTranslationStatus("Translation service unavailable");
  }
}

// Function to show translation status to user
function showTranslationStatus(message) {
  // Create a temporary status indicator
  const statusElement = document.createElement("div");
  statusElement.textContent = message;
  statusElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    max-width: 300px;
    animation: fadeInOut 4s forwards;
  `;

  // Add animation style if not exists
  if (!document.getElementById("translation-status-animation")) {
    const style = document.createElement("style");
    style.id = "translation-status-animation";
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(100%); }
        10% { opacity: 1; transform: translateX(0); }
        90% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(statusElement);

  // Remove after animation
  setTimeout(() => {
    if (statusElement.parentNode) {
      document.body.removeChild(statusElement);
    }
  }, 4000);
}

// security Firebase setup write Token
// const writeToken = `token-${Math.random().toString(36).substr(2, 9)}`;

async function sendCaptionToFirebase(captionText) {
  if (!firebaseEnabled || !streamingCaptionsUrl) {
    return;
  }

  try {
    await window.db.collection("captions").doc(streamingCaptionsUrl).set({
      text: captionText,
      // writeToken: writeToken,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Caption sent to Firebase for ${streamingCaptionsUrl}`);
  } catch (error) {
    console.error("Failed to send caption to Firebase:", error);
  }
}

function checkAndClearText(text) {
  // Convert text to a Blob to get the byte size
  const blob = new Blob([text], { type: "text/plain" });
  const textSize = blob.size;

  const maxSize = 1000000; // 1,000,000 bytes for safety

  if (textSize >= maxSize) {
    console.warn(
      "Text size limit reached. Clearing text to prevent exceeding Firebase's limit."
    );
    resultList = [];
    lastSentCaption = "";
    return "";
  } else {
    return text;
  }
}

let lastResult = "";
let prevSubList = []; // List to store previous subtitle texts
let resultList = [];

// Maintain stable blocks to prevent unnecessary re-renders
let completedBlocks = []; // Store completed blocks with stable IDs
let currentBlockId = null; // ID of the current incomplete block

clearBtn.onclick = function () {
  resultList = [];
  prevSubList = [];
  lastResult = "";
  lastSentCaption = ""; // Reset the last sent caption
  window.transcriptBlocks = []; // Reset blocks
  completedBlocks = []; // Reset completed blocks
  currentBlockId = null; // Reset current block ID
  sentTranslations.clear(); // Clear translation history to allow fresh translations
  lastSentText = ""; // Reset last sent text
  transcriptElement.innerHTML = "";

  // Trigger React component update
  const transcriptUpdateEvt = new CustomEvent("transcriptUpdate", {
    detail: { blocks: [] },
  });
  window.dispatchEvent(transcriptUpdateEvt);

  // Clear translation blocks as well
  const translationClearEvent = new CustomEvent("translationClear");
  window.dispatchEvent(translationClearEvent);

  // Reset the recognizer in the worker so it starts fresh
  if (asrWorker) {
    try {
      asrWorker.postMessage({ type: "reset" });
    } catch (_) {}
  }
  recognizer_stream = null;

  // Show visual indicator that text was cleared
  const clearIndicator = document.createElement("div");
  clearIndicator.textContent = "Tekst kustutatud";
  clearIndicator.className = "clear-indicator";
  clearIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: medium;
    animation: fadeOut 1.5s forwards;
    z-index: 1000;
  `;

  // Add animation style
  if (!document.getElementById("clear-animation")) {
    const style = document.createElement("style");
    style.id = "clear-animation";
    style.textContent = `
      @keyframes fadeOut {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(clearIndicator);

  // Remove the indicator after animation completes
  setTimeout(() => {
    document.body.removeChild(clearIndicator);
  }, 1600);

  // Also clear transcript blocks in the UI after worker reset
  const transcriptClearedEvt = new CustomEvent("transcriptUpdate", {
    detail: { blocks: [] },
  });
  window.dispatchEvent(transcriptClearedEvt);
};

function getDisplayResult() {
  let blocksChanged = false;

  // Check if completed blocks need to be updated (when resultList changes)
  if (completedBlocks.length !== resultList.length) {
    // Add new completed blocks
    for (let i = completedBlocks.length; i < resultList.length; i++) {
      if (resultList[i] && resultList[i].trim() !== "") {
        const newBlock = {
          id: `block-${Date.now()}-${i}`,
          text: cleanText(resultList[i]),
          isComplete: true,
          timestamp: new Date().toISOString(),
        };
        completedBlocks.push(newBlock);
        blocksChanged = true;
      }
    }
  }

  // Handle current incomplete block
  let currentBlock = null;
  if (lastResult.length > 0) {
    const currentText = cleanText(lastResult);

    // Create new block ID if we don't have one or if text changed significantly
    if (!currentBlockId) {
      currentBlockId = `current-${Date.now()}`;
      blocksChanged = true;
    }

    currentBlock = {
      id: currentBlockId,
      text: currentText,
      isComplete: false,
      timestamp: new Date().toISOString(),
    };

    // Check if current block text actually changed
    const existingCurrentBlock = window.transcriptBlocks?.find(
      (block) => block.id === currentBlockId
    );
    if (!existingCurrentBlock || existingCurrentBlock.text !== currentText) {
      blocksChanged = true;
    }
  } else if (currentBlockId) {
    // Current block was removed
    currentBlockId = null;
    blocksChanged = true;
  }

  // Only update global blocks if something actually changed
  if (blocksChanged || !window.transcriptBlocks) {
    const blocks = [...completedBlocks];
    if (currentBlock) {
      blocks.push(currentBlock);
    }
    window.transcriptBlocks = blocks;
  }

  // Return both display text and whether blocks changed
  const result = { blocksChanged };

  // For backward compatibility, also return plain text
  let ans = "";
  for (let s in resultList) {
    if (resultList[s] == "") {
      continue;
    }
    ans += resultList[s] + "\n";
  }

  if (lastResult.length > 0) {
    ans += lastResult + "\n";
  }

  // Clean the text
  const cleanAns = cleanText(ans);

  // Check text size and clear if necessary
  const textToSend = checkAndClearText(cleanAns);

  // Send captions if new words are detected
  const captionText = cleanText(getNewCaptionText(cleanAns));
  if (captionText) {
    if (firebaseEnabled) {
      sendCaptionToFirebase(textToSend);
    }
    if (sendToZoomEnabled) {
      sendCaptionToZoom(captionText);
    }
    // Note: Translation is only sent on sentence completion (isEndpoint) to avoid duplicates
    lastSentCaption = cleanAns.trim(); // Update lastSentCaption
  }

  result.displayText = cleanAns;
  return result;
}

function cleanText(text) {
  // Split by lines to preserve line breaks
  let lines = text.split("\n");

  // Clean each line individually
  lines = lines.map((line) => {
    // Remove extra spaces within the line
    line = line.replace(/\s\s+/g, " ");

    // Remove spaces before punctuation
    line = line.replace(/\s*([,.!?;:])/g, "$1");

    // Remove leading punctuation
    line = line.replace(/^[,.!?;:]+/, "");

    // Trim leading and trailing spaces
    return line.trim();
  });

  // Filter out empty lines and join with newlines
  return lines.filter((line) => line.length > 0).join("\n");
}

function getNewCaptionText(currentResult) {
  // Remove leading and trailing spaces
  let current = currentResult.trim();
  let lastSent = lastSentCaption.trim();

  if (current === lastSent) {
    // No new text
    return "";
  }

  if (current.startsWith(lastSent)) {
    // Get the new part
    let newText = current.substring(lastSent.length).trim();
    return newText;
  } else {
    // The current result has changed significantly, return the full current result
    return current;
  }
}

// Handle subtitle display helpers and list maintenance from the main thread
function getLastNWords(text, n) {
  let words = text.trim().split(/\s+/);
  if (words.length > n) {
    return words.slice(words.length - n).join(" ");
  }

  const cleanAns = cleanText(text);
  const textToSend = checkAndClearText(cleanAns);

  const captionText = cleanText(getNewCaptionText(cleanAns));
  if (captionText) {
    if (firebaseEnabled) {
      sendCaptionToFirebase(textToSend);
    }
    if (sendToZoomEnabled) {
      sendCaptionToZoom(captionText);
    }
    lastSentCaption = cleanAns.trim();
  }
  return text;
}

function updateResultList(newResult) {
  if (!subtitleMode) {
    resultList.push(newResult);
    return;
  }
  let combinedText = resultList.join(" ") + " " + newResult;
  let sentences = combinedText.trim().split(".").filter(Boolean);
  let words = combinedText.trim().split(/\s+/);

  if (words.length > maxWords) {
    while (words.length > maxWords) {
      let firstSentenceWords = sentences[0].trim().split(/\s+/).length;
      if (firstSentenceWords > minSentenceLength) {
        sentences.shift();
      } else {
        break;
      }
      combinedText = sentences.join(". ").trim();
      words = combinedText.split(/\s+/);
    }
    resultList = sentences.map((sentence) => sentence.trim());
  } else {
    resultList.push(newResult);
  }
}

function handlePartialResult(result) {
  if (result.length > 0 && lastResult != result) {
    lastResult = result;

    if (translationEnabled && result.trim()) {
      const currentWordCount = result.trim().split(/\s+/).length;
      if (currentWordCount >= 6) {
        const currentText = result.trim();
        let textToTranslate = "";
        if (!lastSentText) {
          textToTranslate = currentText;
        } else if (currentText.startsWith(lastSentText)) {
          const newPart = currentText.substring(lastSentText.length).trim();
          const newWordCount = newPart
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
          if (newWordCount >= 6) {
            textToTranslate = newPart;
          }
        } else {
          textToTranslate = currentText;
        }
        if (textToTranslate) {
          sendTextToTranslationServer(textToTranslate, true);
          lastSentText = currentText;
        }
      }
    }
  }

  const isScrolledToBottom =
    transcriptElement.scrollHeight - transcriptElement.clientHeight <=
    transcriptElement.scrollTop + 10;

  if (transcriptElement) {
    if (subtitleMode) {
      let combinedText = resultList.join(" ") + " " + lastResult;
      let displayText = getLastNWords(combinedText, maxWords);
      transcriptElement.innerText = cleanText(displayText);
    } else {
      const result = getDisplayResult();
      transcriptElement.innerText = result.displayText;
      if (result.blocksChanged) {
        const transcriptUpdateEvt = new CustomEvent("transcriptUpdate", {
          detail: { blocks: window.transcriptBlocks },
        });
        window.dispatchEvent(transcriptUpdateEvt);
      }
    }
  }

  if (isScrolledToBottom) {
    transcriptElement.scrollTop = transcriptElement.scrollHeight;
  }
}

function handleFinalResult(finalText) {
  if (typeof finalText !== "string") return;
  lastResult = finalText;

  if (lastResult.length > 8) {
    if (translationEnabled && lastResult.trim()) {
      const cleanedFinal = lastResult.trim();
      let finalTextToTranslate = "";
      if (!lastSentText) {
        finalTextToTranslate = cleanedFinal;
      } else if (cleanedFinal.startsWith(lastSentText)) {
        const newFinalPart = cleanedFinal.substring(lastSentText.length).trim();
        const newFinalWordCount = newFinalPart
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
        if (newFinalPart && newFinalWordCount > 0) {
          finalTextToTranslate = newFinalPart;
        }
      } else if (cleanedFinal !== lastSentText) {
        finalTextToTranslate = cleanedFinal;
      }
      if (finalTextToTranslate) {
        sendTextToTranslationServer(finalTextToTranslate, false);
      }
    }

    updateResultList(lastResult);
    prevSubList.push(lastResult);
    lastResult = "";
    currentBlockId = null;
    lastSentText = "";
  }

  const isScrolledToBottom =
    transcriptElement.scrollHeight - transcriptElement.clientHeight <=
    transcriptElement.scrollTop + 10;

  if (transcriptElement) {
    if (subtitleMode) {
      let combinedText = resultList.join(" ") + " " + lastResult;
      let displayText = getLastNWords(combinedText, maxWords);
      transcriptElement.innerText = cleanText(displayText);
    } else {
      const result = getDisplayResult();
      transcriptElement.innerText = result.displayText;
      if (result.blocksChanged) {
        const transcriptUpdateEvt2 = new CustomEvent("transcriptUpdate", {
          detail: { blocks: window.transcriptBlocks },
        });
        window.dispatchEvent(transcriptUpdateEvt2);
      }
    }
  }

  if (isScrolledToBottom) {
    transcriptElement.scrollTop = transcriptElement.scrollHeight;
  }
}

// let flushTimer = null;

// function resetFlushTimer() {
//   if (flushTimer) {
//     clearTimeout(flushTimer);
//   }
//   flushTimer = setTimeout(() => {
//     // If there is any uncommitted text, push it as a new line.
//     if (lastResult.length > 0) {
//       updateResultList(lastResult);
//       lastResult = "";
//       // Immediately update the transcript element with the new multi‐line transcript.
//       const transcriptElement = document.getElementById("transcriptText");
//       if (transcriptElement) {
//         transcriptElement.innerText = getDisplayResult();
//       }
//     }
//   }, 5000); // 5000 ms = 5 seconds
// }

// Create the "Scroll to Bottom" button with an arrow icon
const scrollToBottomBtn = document.createElement("button");
scrollToBottomBtn.id = "scrollToBottomBtn";
// Use an inline SVG for a down arrow icon
scrollToBottomBtn.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" 
       fill="none" stroke="currentColor" stroke-width="2" 
       stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

// Minimalistic, dark-themed styles for the button
Object.assign(scrollToBottomBtn.style, {
  position: "fixed",
  bottom: "10%",
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "rgba(0, 0, 0, 0.6)", // dark semi-transparent background
  border: "none",
  borderRadius: "50%",
  padding: "8px",
  cursor: "pointer",
  zIndex: "1000",
  display: "none", // hidden initially
  outline: "none",
  transition: "opacity 0.3s",
  color: "#fff", // ensure the arrow (stroke) appears white
  zIndex: "1",
});

// When clicked, scroll the transcript element to the bottom and hide the button
scrollToBottomBtn.addEventListener("click", () => {
  transcriptElement.scrollTop = transcriptElement.scrollHeight;
  scrollToBottomBtn.style.display = "none";
});

// Append the button to the document body (or another container if desired)
document.body.appendChild(scrollToBottomBtn);

// Attach a scroll listener to the transcript element to toggle the button's visibility
transcriptElement.addEventListener("scroll", () => {
  const distanceFromBottom =
    transcriptElement.scrollHeight -
    transcriptElement.clientHeight -
    transcriptElement.scrollTop;

  // Show the button if the user is more than 150px away from the bottom
  if (distanceFromBottom > 150) {
    scrollToBottomBtn.style.display = "block";
  } else {
    scrollToBottomBtn.style.display = "none";
  }
});

// Initialize ASR Web Worker instead of loading WASM on the main thread
let asrWorker = null;
let asrWorkerInitialized = false;

// SharedArrayBuffer audio ring buffer (optional fast path)
let sabSupported =
  typeof SharedArrayBuffer !== "undefined" &&
  (typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false);
let sabDataBuffer = null; // SharedArrayBuffer for audio samples (Float32)
let sabCtrlBuffer = null; // SharedArrayBuffer for control (Int32: [w, r, flags])
let sabRingCapacity = 16384; // ~1s at 16 kHz, power of two preferred
let usingSharedBuffer = false;

function setupSharedRingBufferIfPossible() {
  if (!sabSupported) return false;
  // When using WebSocket ASR, avoid SAB so frames arrive via port.onmessage
  if (useWebSocketAsr) {
    usingSharedBuffer = false;
    return false;
  }
  if (usingSharedBuffer) return true;
  if (!recorder || !asrWorker) return false;

  try {
    sabDataBuffer = new SharedArrayBuffer(
      Float32Array.BYTES_PER_ELEMENT * sabRingCapacity
    );
    sabCtrlBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3);
    const ctrl = new Int32Array(sabCtrlBuffer);
    ctrl[0] = 0; // write index
    ctrl[1] = 0; // read index
    ctrl[2] = 0; // flags

    // Send to AudioWorklet and Worker
    try {
      recorder.port.postMessage({
        type: "sab_init",
        dataSab: sabDataBuffer,
        controlSab: sabCtrlBuffer,
      });
    } catch (e) {
      console.warn("Failed to init SAB in worklet", e);
    }

    try {
      asrWorker.postMessage({
        type: "sab_setup",
        dataSab: sabDataBuffer,
        controlSab: sabCtrlBuffer,
        capacity: sabRingCapacity,
      });
    } catch (e) {
      console.warn("Failed to init SAB in ASR worker", e);
    }

    usingSharedBuffer = true;
    console.log("SharedArrayBuffer audio path enabled");
    return true;
  } catch (e) {
    console.warn("SharedArrayBuffer not available or failed to initialize", e);
    usingSharedBuffer = false;
    return false;
  }
}

function setupAsrWorker() {
  if (asrWorker) return;
  try {
    asrWorker = new Worker("/onnx/asr-worker.js");
    asrWorker.onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === "initialized") {
        asrWorkerInitialized = true;
        if (startBtn) startBtn.disabled = false;
        const event = new Event("modelInitialized");
        window.dispatchEvent(event);
        // Attempt SAB hookup once worker is ready
        setupSharedRingBufferIfPossible();
      } else if (msg.type === "partial") {
        handlePartialResult(msg.text || "");
      } else if (msg.type === "final") {
        handleFinalResult(msg.text || "");
      } else if (msg.type === "error") {
        console.error("ASR worker error:", msg.error);
      }
    };
    // Provide initial config
    asrWorker.postMessage({ type: "init", expectedSampleRate: 16000 });
  } catch (e) {
    console.error("Failed to start ASR worker", e);
  }
}

setupAsrWorker();

let audioCtx;
let mediaStream;
let userMediaStream = null; // Raw MediaStream from getUserMedia
let isGraphConnected = false; // Track whether audio graph is connected

let expectedSampleRate = 16000;
let recordSampleRate; // the sampleRate of the microphone
let recorder = null; // the microphone
let muteGain = null; // silent sink for AudioWorklet processing
let leftchannel = []; // TODO: Use a single channel

let recordingLength = 0; // number of samples so far

// recognizer is now in the worker
let recognizer = null;
let recognizer_stream = null;
let lastDecodeTs = 0;

// Lazily initialize microphone and audio graph only when starting recognition
async function setupAudioGraph(stream) {
  if (!audioCtx || audioCtx.state === "closed") {
    // Firefox compatibility: detect browser and handle sample rate accordingly
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

    if (isFirefox) {
      // For Firefox, don't specify sample rate to avoid connection errors
      audioCtx = new AudioContext();
      console.log(
        "Firefox detected: using default sample rate",
        audioCtx.sampleRate
      );
    } else {
      // For Chrome and other browsers, try to use 16000 Hz for efficiency
      try {
        audioCtx = new AudioContext({ sampleRate: 16000 });
      } catch (e) {
        console.warn("16000 Hz not supported, using default sample rate");
        audioCtx = new AudioContext();
      }
    }
  }

  console.log(audioCtx);
  recordSampleRate = audioCtx.sampleRate;
  console.log("sample rate " + recordSampleRate);

  mediaStream = audioCtx.createMediaStreamSource(stream);
  console.log("media stream", mediaStream);

  // (Re)load the worklet module for the current AudioContext
  await audioCtx.audioWorklet.addModule("/onnx/audio-worklet-processor.js");

  recorder = new AudioWorkletNode(audioCtx, "downsampler", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });

  // Create a mute gain so we can connect worklet into the graph without audible output
  if (!muteGain || muteGain.context !== audioCtx) {
    muteGain = audioCtx.createGain();
    muteGain.gain.value = 0;
  }
  console.log("recorder", recorder);

  recorder.port.onmessage = (event) => {
    const data = event.data;
    const samples =
      data instanceof Float32Array ? data : new Float32Array(data);

    // Route audio depending on ASR mode
    if (useWebSocketAsr) {
      // Ensure a WS stream is active; if not, try to start it
      startWsStreamIfNeeded();
      if (wsAsr && wsAsrReady && wsStreamActive) {
        // Convert Float32 [-1,1] to 16-bit PCM LE and send
        const pcm = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; ++i) {
          let s = samples[i];
          if (s >= 1) s = 1;
          else if (s <= -1) s = -1;
          pcm[i] = s * 32767;
        }
        try {
          wsAsr.send(pcm.buffer);
        } catch (e) {
          // If sending fails because stream isn't active, attempt to start and skip this frame
          wsStreamActive = false;
          startWsStreamIfNeeded();
        }
      }
    } else if (asrWorkerInitialized && asrWorker && !usingSharedBuffer) {
      // Transfer the buffer to avoid copies
      asrWorker.postMessage({ type: "audio", samples }, [samples.buffer]);
    }

    const isScrolledToBottom =
      transcriptElement.scrollHeight - transcriptElement.clientHeight <=
      transcriptElement.scrollTop + 10;

    if (transcriptElement) {
      if (subtitleMode) {
        let combinedText = resultList.join(" ") + " " + lastResult;
        let displayText = getLastNWords(combinedText, maxWords);
        transcriptElement.innerText = cleanText(displayText);
      } else {
        const result = getDisplayResult();
        transcriptElement.innerText = result.displayText;
        if (result.blocksChanged) {
          const transcriptUpdateEvt = new CustomEvent("transcriptUpdate", {
            detail: { blocks: window.transcriptBlocks },
          });
          window.dispatchEvent(transcriptUpdateEvt);
        }
      }
    }

    if (isScrolledToBottom) {
      transcriptElement.scrollTop = transcriptElement.scrollHeight;
    }

    // Function to get the last N words from a text
    function getLastNWords(text, n) {
      let words = text.trim().split(/\s+/);
      if (words.length > n) {
        return words.slice(words.length - n).join(" ");
      }

      const cleanAns = cleanText(text);

      // Check text size and clear if necessary
      const textToSend = checkAndClearText(cleanAns);

      // Send captions if new words are detected
      const captionText = cleanText(getNewCaptionText(cleanAns));
      if (captionText) {
        if (firebaseEnabled) {
          sendCaptionToFirebase(textToSend);
        }
        if (sendToZoomEnabled) {
          sendCaptionToZoom(captionText);
        }
        lastSentCaption = cleanAns.trim(); // Update lastSentCaption
      }
      return text;
    }

    // Function to update the resultList to maintain a rolling window of 24 words
    function updateResultList(newResult) {
      if (!subtitleMode) {
        resultList.push(newResult);
        return;
      }
      // Combine existing resultList and newResult into a single string
      let combinedText = resultList.join(" ") + " " + newResult;
      let sentences = combinedText.trim().split(".").filter(Boolean); // Split by sentences

      let words = combinedText.trim().split(/\s+/);

      // Trim the list if it exceeds the maxWords limit
      if (words.length > maxWords) {
        // Remove the first sentence until we're back under the maxWords limit
        while (words.length > maxWords) {
          let firstSentenceWords = sentences[0].trim().split(/\s+/).length;

          // Only remove the first sentence if it has more than minSentenceLength words
          if (firstSentenceWords > minSentenceLength) {
            sentences.shift(); // Remove the first sentence
          } else {
            break;
          }

          // Recalculate words after removing the sentence
          combinedText = sentences.join(". ").trim();
          words = combinedText.split(/\s+/);
        }

        // Set the updated resultList to the remaining sentences
        resultList = sentences.map((sentence) => sentence.trim()); // Add periods back to the end of each sentence
      } else {
        resultList.push(newResult);
      }
    }

    let buf = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; ++i) {
      let s = samples[i];
      if (s >= 1) s = 1;
      else if (s <= -1) s = -1;
      buf[i] = s * 32767;
    }

    leftchannel.push(buf);
    recordingLength += samples.length;
  };

  // Try enabling SAB path once recorder exists
  // Force re-init of SAB on newly created recorder even if it was previously enabled
  usingSharedBuffer = false;
  setupSharedRingBufferIfPossible();
}

async function acquireUserMedia() {
  const constraints = { audio: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    userMediaStream = stream;
    await setupAudioGraph(stream);
  } catch (err) {
    console.log("The following error occured: " + err);
    throw err;
  }
}

function connectGraph() {
  if (!mediaStream || !recorder || !muteGain || !audioCtx) return;
  mediaStream.connect(recorder);
  recorder.connect(muteGain);
  muteGain.connect(audioCtx.destination);
  isGraphConnected = true;
}

function disconnectGraph() {
  try {
    if (mediaStream && recorder) {
      mediaStream.disconnect(recorder);
    }
  } catch (_) {}
  try {
    if (recorder && muteGain) {
      recorder.disconnect(muteGain);
    }
  } catch (_) {}
  try {
    if (muteGain && audioCtx) {
      muteGain.disconnect(audioCtx.destination);
    }
  } catch (_) {}
  isGraphConnected = false;
  // Ensure SAB will be reinitialized on next start
  usingSharedBuffer = false;
  sabDataBuffer = null;
  sabCtrlBuffer = null;
}

async function reinitializeRecorderForCurrentMode() {
  if (!userMediaStream) return;
  // Recreate worklet node so SAB state aligns with current mode
  disconnectGraph();
  try {
    await setupAudioGraph(userMediaStream);
    connectGraph();
  } catch (_) {}
}

async function startRecordingInternal() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia not supported on your browser!");
    alert("getUserMedia not supported on your browser!");
    return;
  }

  if (!userMediaStream) {
    await acquireUserMedia();
  } else if (!audioCtx || audioCtx.state === "closed") {
    await setupAudioGraph(userMediaStream);
  }

  // If AudioContext was suspended on stop, resume it before connecting
  if (audioCtx && audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch (_) {}
  }

  connectGraph();

  // Ensure WS stream started if WS mode is active
  if (useWebSocketAsr) {
    startWsStreamIfNeeded();
  }

  console.log("recorder started");

  if (stopBtn) stopBtn.disabled = false;
  if (startBtn) startBtn.disabled = true;

  if (toggleBtn) {
    toggleBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="none" class="w-4 h-4"><circle cx="12" cy="12" r="8" /></svg> Peata';

    toggleBtn.className =
      "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1";
  }
}

function stopRecordingInternal() {
  console.log("recorder stopped");

  // If using WebSocket ASR, flush to get final result without closing stream
  if (useWebSocketAsr && wsAsr && wsAsrReady) {
    try {
      wsAsrSendJson({ event: "flush" });
      // Explicitly end current WS stream so a fresh 'start' will be sent on resume
      wsAsrSendJson({ event: "end" });
      wsStreamActive = false;
    } catch (_) {}
  }

  // Disconnect audio graph
  disconnectGraph();

  // Stop and release the microphone tracks so the browser shows mic as unused
  if (userMediaStream) {
    try {
      userMediaStream.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    userMediaStream = null;
  }

  // Keep AudioContext for faster restart, but it's not required to hold the mic
  // Optionally suspend to save CPU
  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend().catch(() => {});
  }

  if (stopBtn) stopBtn.disabled = true;
  if (startBtn) startBtn.disabled = false;

  if (toggleBtn) {
    toggleBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5"><polygon points="5,3 19,12 5,21" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" /></svg> Alusta';

    toggleBtn.className =
      "bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1";
  }

  function getFirstTwoWords(text) {
    let words = text.trim().split(/\s+/).slice(0, 2);
    return words.join(" ");
  }

  let clipName = new Date().toISOString();
  if (resultList.length > 0) {
    clipName = getFirstTwoWords(resultList[0]);
  }

  const clipContainer = document.createElement("article");
  const clipLabel = document.createElement("p");
  const audio = document.createElement("audio");
  const deleteButton = document.createElement("button");

  const deleteIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3 6h18v2H3V6zm2 2h14l-1.5 14h-11L5 8zm6-3h2v2h-2V5zm-3.5 0H11v2H8.5V5zm7 0H15v2h-2.5V5z"/>
        </svg>
      `;

  clipContainer.classList.add("clip");
  audio.setAttribute("controls", "");
  deleteButton.className = "delete";
  deleteButton.innerHTML = deleteIcon;

  clipLabel.textContent = clipName;
  clipLabel.style.cursor = "pointer";

  audio.controls = true;
  let samples = flatten(leftchannel);
  const blob = toWav(samples);

  leftchannel = [];
  const audioURL = window.URL.createObjectURL(blob);
  audio.src = audioURL;
  console.log("recorder stopped");

  deleteButton.onclick = function (e) {
    let evtTgt = e.target;
    evtTgt.closest(".clip").remove();
  };

  clipLabel.onclick = function () {
    const existingName = clipLabel.textContent;
    const newClipName = prompt("Enter a new name for your sound clip?");
    if (newClipName === null) {
      clipLabel.textContent = existingName;
    } else {
      clipLabel.textContent = newClipName;
    }
  };
}

// Wire up start/stop buttons if present
if (startBtn) {
  startBtn.onclick = function () {
    startRecordingInternal();
  };
}

if (stopBtn) {
  stopBtn.onclick = function () {
    stopRecordingInternal();
  };
}

// Expose controls for React components if needed
window.startRecognition = startRecordingInternal;
window.stopRecognition = stopRecordingInternal;

// Integration of additional code

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function flatten(listOfSamples) {
  let n = 0;
  for (let i = 0; i < listOfSamples.length; ++i) {
    n += listOfSamples[i].length;
  }
  let ans = new Int16Array(n);

  let offset = 0;
  for (let i = 0; i < listOfSamples.length; ++i) {
    ans.set(listOfSamples[i], offset);
    offset += listOfSamples[i].length;
  }
  return ans;
}

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function toWav(samples) {
  let buf = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buf);

  // http://soundfile.sapp.org/doc/WaveFormat/
  //                   F F I R
  view.setUint32(0, 0x46464952, true); // chunkID
  view.setUint32(4, 36 + samples.length * 2, true); // chunkSize
  //                   E V A W
  view.setUint32(8, 0x45564157, true); // format
  //
  //                      t m f
  view.setUint32(12, 0x20746d66, true); // subchunk1ID
  view.setUint32(16, 16, true); // subchunk1Size, 16 for PCM
  view.setUint32(20, 1, true); // audioFormat, 1 for PCM
  view.setUint16(22, 1, true); // numChannels: 1 channel
  view.setUint32(24, expectedSampleRate, true); // sampleRate
  view.setUint32(28, expectedSampleRate * 2, true); // byteRate
  view.setUint16(32, 2, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  view.setUint32(36, 0x61746164, true); // Subchunk2ID
  view.setUint32(40, samples.length * 2, true); // subchunk2Size

  let offset = 44;
  for (let i = 0; i < samples.length; ++i) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

// this function is copied from
// https://github.com/awslabs/aws-lex-browser-audio-capture/blob/master/lib/worker.js#L46
// Enhanced to always handle downsampling from any rate to target rate
function downsampleBuffer(buffer, exportSampleRate) {
  // Use the actual AudioContext sample rate, not the expected one
  const sourceSampleRate = audioCtx ? audioCtx.sampleRate : recordSampleRate;

  if (exportSampleRate === sourceSampleRate) {
    return buffer;
  }

  var sampleRateRatio = sourceSampleRate / exportSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;

  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0,
      count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}
