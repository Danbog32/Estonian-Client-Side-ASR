const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const hint = document.getElementById("hint");
const soundClips = document.getElementById("sound-clips");
const toggleBtn = document.getElementById("toggleBtn");

let textArea = document.getElementById("results");

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

let lastSentCaption = ""; // Variable to store the last caption sent to the API

// Receive API token and URL from Settings (to be set in the Settings component)
window.setApiSettings = function (token) {
  apiToken = token;
};

// Function to send caption to Zoom API
async function sendCaptionToZoom(captionText) {
  if (!apiToken) {
    console.error("API token or URL is missing");
    return;
  }

  try {
    // Adjust this to the correct endpoint as per your setup
    const response = await fetch("/api/zoom/caption", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        captionText, // The new caption text
        zoomTokenUrl: apiToken, // Assuming this is the API token passed in
        lang: "en-US", // Language for the caption (adjust based on requirement)
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`Caption sent successfully with seq: ${data.seq}`);
    } else {
      console.error(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to send caption:", error);
  }
}

let captionEnabled = false; // Whether the feature is enabled
let captionName = ""; // The name of the caption session

// Function to send caption to Firebase
async function sendCaptionToFirebase(captionText) {
  if (!captionEnabled || !captionName) {
    return;
  }

  try {
    await window.db.collection("captions").doc(captionName).set({
      text: captionText,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Caption sent to Firebase for ${captionName}`);
  } catch (error) {
    console.error("Failed to send caption to Firebase:", error);
  }
}

// Function to get the new caption (text that hasn't been sent yet)
function getNewCaptionText(currentResult) {
  // Find the part of the result that hasn't been sent yet
  const newCaption = currentResult.replace(lastSentCaption, "").trim();

  // If there's no new caption, return null to avoid sending unnecessary requests
  if (newCaption.length === 0) {
    return null;
  }

  return cleanText(newCaption);
}

// Receive settings updates (this should be triggered from the Settings component)
window.setSubtitleMode = setSubtitleMode;

let lastResult = "";
let prevSubList = []; // List to store previous subtitle texts
let resultList = [];

clearBtn.onclick = function () {
  resultList = [];
  prevSubList = [];
  textArea.value = "";
  textArea.scrollTop = textArea.scrollHeight; // auto scroll
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

  // Send captions to Firebase if the feature is enabled
  const captionText = getNewCaptionText(ans);
  if (captionText) {
    sendCaptionToFirebase(captionText);
  }

  return cleanText(ans);
}

function cleanText(text) {
  // Remove double spaces
  text = text.replace(/\s\s+/g, " ");

  // Remove spaces before commas and periods
  text = text.replace(/\s*([,.])/g, "$1");

  // Remove leading commas from sentences
  text = text.replace(/^\s*,/, "");

  return text;
}

Module = {};
Module.onRuntimeInitialized = function () {
  console.log("inited!");
  hint.innerText = "Model loaded! Please click start";

  startBtn.disabled = false;

  recognizer = createOnlineRecognizer(Module);
  console.log("recognizer is created!", recognizer);

  // Emit event to indicate model initialization
  const event = new Event("modelInitialized");
  window.dispatchEvent(event);
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
      }

      if (isEndpoint) {
        if (lastResult.length > 0) {
          updateResultList(lastResult);
          prevSubList.push(lastResult);
          lastResult = "";
        }
        recognizer.reset(recognizer_stream);
      }

      const isScrolledToBottom =
        textArea.scrollHeight - textArea.clientHeight <= textArea.scrollTop + 1;

      if (subtitleMode) {
        let combinedText = resultList.join(" ") + " " + lastResult;
        let displayText = getLastNWords(combinedText, maxWords);

        textArea.value = cleanText(displayText);

        // Clear the subtitle after 3 seconds of inactivity
        clearTimeout(subtitleTimeout);
        subtitleTimeout = setTimeout(() => {
          if (!isEndpoint) {
            textArea.value = cleanText(displayText);
          }
        }, 3000);
      } else {
        textArea.value = getDisplayResult();
      }

      if (isScrolledToBottom) {
        textArea.scrollTop = textArea.scrollHeight;
      }

      // Function to get the last N words from a text
      function getLastNWords(text, n) {
        let words = text.trim().split(/\s+/);
        if (words.length > n) {
          return words.slice(words.length - n).join(" ");
        }
        return text;
      }

      let subtitleTimeout;

      // Function to update the resultList to maintain a rolling window of 24 words
      function updateResultList(newResult) {
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
          resultList = sentences.map((sentence) => sentence.trim() + "."); // Add periods back to the end of each sentence
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

    // Function to generate a unique caption name
    function generateCaptionName() {
      // Generate a unique ID (e.g., using current timestamp and random number)
      const uniqueId = `caption-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;
      return uniqueId;
    }

    startBtn.onclick = function () {
      mediaStream.connect(recorder);
      recorder.connect(audioCtx.destination);

      console.log("recorder started");

      stopBtn.disabled = false;
      startBtn.disabled = true;

      if (toggleBtn) {
        toggleBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="none" class="w-4 h-4"><circle cx="12" cy="12" r="8" /></svg> Stop';

        toggleBtn.className =
          "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1";
      }

      // Generate unique caption name if feature is enabled
      if (captionEnabled && !captionName) {
        captionName = generateCaptionName();
        const captionURL = `${window.location.origin}/${captionName}`;
        alert(`Live captions are available at: ${captionURL}`);
        // Optionally, display the URL in the UI
        const captionLinkElement = document.getElementById("captionLink");
        if (captionLinkElement) {
          captionLinkElement.innerHTML = `Live captions: <a href="${captionURL}" target="_blank">${captionURL}</a>`;
        }
      }
    };

    // Function to set caption settings (called from Settings)
    window.setCaptionSettings = function (enabled) {
      captionEnabled = enabled;
      if (!enabled) {
        captionName = ""; // Reset caption name when disabled
      }
    };

    stopBtn.onclick = function () {
      console.log("recorder stopped");
      hint.innerText = 'Press "start" to continue';

      recorder.disconnect(audioCtx.destination);
      mediaStream.disconnect(recorder);

      stopBtn.disabled = true;
      startBtn.disabled = false;

      if (toggleBtn) {
        toggleBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5"><polygon points="5,3 19,12 5,21" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" /></svg> Start';

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
      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete";

      clipLabel.textContent = clipName;

      // add cursor pointer to clipLabel
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
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
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
