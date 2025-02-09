const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const hint = document.getElementById("hint");
const soundClips = document.getElementById("sound-clips");
const toggleBtn = document.getElementById("toggleBtn");

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

clearBtn.onclick = function () {
  resultList = [];
  prevSubList = [];
  lastResult = "";
  lastSentCaption = ""; // Reset the last sent caption
  transcriptElement.innerHTML = "";
  // Reset the recognizer's stream so it starts fresh
  if (recognizer_stream) {
    recognizer.reset(recognizer_stream);
    recognizer_stream = null;
  }
};

function getDisplayResult() {
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
    lastSentCaption = cleanAns.trim(); // Update lastSentCaption
  }

  return cleanAns;
}

function cleanText(text) {
  // Remove extra spaces
  text = text.replace(/\s\s+/g, " ");

  // Remove spaces before punctuation
  text = text.replace(/\s*([,.!?;:])/g, "$1");

  // Remove leading punctuation
  text = text.replace(/^[,.!?;:]+/, "");

  // Trim leading and trailing spaces
  text = text.trim();

  return text;
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

let flushTimer = null;

function resetFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    // If there is any uncommitted text, push it as a new line.
    if (lastResult.length > 0) {
      updateResultList(lastResult);
      lastResult = "";
      // Immediately update the transcript element with the new multi‐line transcript.
      const transcriptElement = document.getElementById("transcriptText");
      if (transcriptElement) {
        transcriptElement.innerText = getDisplayResult();
      }
    }
  }, 5000); // 5000 ms = 5 seconds
}

// Instead of: Module = {};
window.Module = window.Module || {};
// Attach our onRuntimeInitialized callback to the (possibly already defined) Module.
Module.onRuntimeInitialized = function () {
  // Wait until all required methods are available
  function waitForExports() {
    if (
      typeof Module._malloc !== "function" ||
      typeof Module.lengthBytesUTF8 !== "function"
    ) {
      console.warn("Waiting for Module exports...");
      setTimeout(waitForExports, 500);
    } else {
      console.log("Module exports are ready!");
      startBtn.disabled = false;
      recognizer = createOnlineRecognizer(Module);
      console.log("Recognizer is created!", recognizer);
      // Signal that the model is ready
      const event = new Event("modelInitialized");
      window.dispatchEvent(event);
    }
  }
  waitForExports();
};

let audioCtx;
let mediaStream;

let expectedSampleRate = 16000;
let recordSampleRate; // the sampleRate of the microphone
let recorder = null; // the microphone
let leftchannel = []; // TODO: Use a single channel

let recordingLength = 0; // number of samples so far

let recognizer = null;
let recognizer_stream = null;

if (navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");

  const constraints = { audio: true };

  let onSuccess = function (stream) {
    if (!audioCtx) {
      audioCtx = new AudioContext({ sampleRate: 16000 });
    }
    console.log(audioCtx);
    recordSampleRate = audioCtx.sampleRate;
    console.log("sample rate " + recordSampleRate);

    mediaStream = audioCtx.createMediaStreamSource(stream);
    console.log("media stream", mediaStream);

    var bufferSize = 4096;
    var numberOfInputChannels = 1;
    var numberOfOutputChannels = 2;
    if (audioCtx.createScriptProcessor) {
      recorder = audioCtx.createScriptProcessor(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels
      );
    } else {
      recorder = audioCtx.createJavaScriptNode(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels
      );
    }
    console.log("recorder", recorder);

    recorder.onaudioprocess = function (e) {
      let samples = new Float32Array(e.inputBuffer.getChannelData(0));
      samples = downsampleBuffer(samples, expectedSampleRate);

      if (recognizer_stream == null) {
        recognizer_stream = recognizer.createStream();
      }

      recognizer_stream.acceptWaveform(expectedSampleRate, samples);
      while (recognizer.isReady(recognizer_stream)) {
        recognizer.decode(recognizer_stream);
      }

      let isEndpoint = recognizer.isEndpoint(recognizer_stream);
      let result = recognizer.getResult(recognizer_stream).text;

      if (result.length > 0 && lastResult != result) {
        lastResult = result;
        // Every time new text arrives, reset the flush timer.
        resetFlushTimer();
      }

      if (isEndpoint) {
        if (lastResult.length > 0) {
          updateResultList(lastResult);
          prevSubList.push(lastResult);
          lastResult = "";
          if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
          }
        }
        recognizer.reset(recognizer_stream);
      }

      // const isScrolledToBottom =
      //   transcriptElement.scrollHeight - transcriptElement.clientHeight <=
      //   transcriptElement.scrollTop + 1;

      if (transcriptElement) {
        if (subtitleMode) {
          let combinedText = resultList.join(" ") + " " + lastResult;
          let displayText = getLastNWords(combinedText, maxWords);
          transcriptElement.innerText = cleanText(displayText);
        } else {
          transcriptElement.innerText = getDisplayResult();
        }
      }

      // if (isScrolledToBottom) {
      //   transcriptElement.scrollTop = transcriptElement.scrollHeight;
      // }

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

        samples[i] = s;
        buf[i] = s * 32767;
      }

      leftchannel.push(buf);
      recordingLength += bufferSize;
    };

    startBtn.onclick = function () {
      mediaStream.connect(recorder);
      recorder.connect(audioCtx.destination);

      console.log("recorder started");

      stopBtn.disabled = false;
      startBtn.disabled = true;

      if (toggleBtn) {
        toggleBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="none" class="w-4 h-4"><circle cx="12" cy="12" r="8" /></svg> Peata';

        toggleBtn.className =
          "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1";
      }
    };

    stopBtn.onclick = function () {
      console.log("recorder stopped");
      // hint.innerText = 'Press "start" to continue';

      recorder.disconnect(audioCtx.destination);
      mediaStream.disconnect(recorder);

      stopBtn.disabled = true;
      startBtn.disabled = false;

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

      // Use an inline SVG for the trash icon
      const deleteIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3 6h18v2H3V6zm2 2h14l-1.5 14h-11L5 8zm6-3h2v2h-2V5zm-3.5 0H11v2H8.5V5zm7 0H15v2h-2.5V5z"/>
        </svg>
      `;

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      deleteButton.className = "delete";
      deleteButton.innerHTML = deleteIcon; // Set the inner HTML of the button to the SVG

      clipLabel.textContent = clipName;

      // Add cursor pointer to clipLabel
      clipLabel.style.cursor = "pointer";

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      let samples = flatten(leftchannel);
      const blob = toWav(samples);

      leftchannel = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function (e) {
        let evtTgt = e.target;
        evtTgt.closest(".clip").remove(); // Safely find the parent container
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
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("getUserMedia not supported on your browser!");
  alert("getUserMedia not supported on your browser!");
}

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
function downsampleBuffer(buffer, exportSampleRate) {
  if (exportSampleRate === recordSampleRate) {
    return buffer;
  }
  var sampleRateRatio = recordSampleRate / exportSampleRate;
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
