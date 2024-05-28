"use client";

import { useEffect } from 'react';

export default function Asr() {
  useEffect(() => {
    // Load the necessary scripts
    const loadScripts = async () => {
      const script1 = document.createElement('script');
      script1.src = 'wasm/sherpa-ncnn-wasm-main.js';
      script1.async = true;
      script1.onload = () => {
        // Ensure the script loaded without conflicts
        if (typeof startBtn !== 'undefined') {
          console.warn('startBtn already defined, skipping initialization of script1');
        } else {
          // Initialize variables and logic specific to script1
          // Your logic here
        }
      };
      document.body.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'wasm/sherpa-ncnn.js';
      script2.async = true;
      script2.onload = () => {
        // Ensure the script loaded without conflicts
        if (typeof Stream !== 'undefined') {
          console.warn('Stream already defined, skipping initialization of script2');
        } else {
          // Initialize variables and logic specific to script2
          // Your logic here
        }
      };
      document.body.appendChild(script2);

      const script3 = document.createElement('script');
      script3.src = 'wasm/app.js';
      script3.async = true;
      document.body.appendChild(script3);
    };

    loadScripts();
  }, []);

  return (
    <div>
      <h1>
        Next-gen Kaldi + WebAssembly
        <br />
        ASR Demo with <a href="https://github.com/k2-fsa/sherpa-ncnn">sherpa-ncnn</a>
      </h1>
      <div style={{ textAlign: 'center' }}>
        <span id="hint">Loading model ... ...</span>
        <br />
        <br />
        <button id="startBtn" disabled>Start</button>
        <button id="stopBtn" disabled>Stop</button>
        <button id="clearBtn">Clear</button>
        <br />
        <br />
        <textarea id="results" rows="10" readOnly style={{ width: '100%' }}></textarea>
      </div>

      <section flex="1" overflow="auto" id="sound-clips"></section>
    </div>
  );
}
