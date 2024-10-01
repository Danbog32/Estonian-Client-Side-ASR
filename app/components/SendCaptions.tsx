// app/components/SendCaptions.tsx

"use client";

import React, { useState } from "react";

const SendCaptions: React.FC = () => {
  const [captionText, setCaptionText] = useState("");
  const [zoomTokenUrl, setZoomTokenUrl] = useState("");
  const [lang, setLang] = useState("en-US"); // Default language is English (en-US)
  const [responseMessage, setResponseMessage] = useState("");

  // Function to send caption to the API
  const sendCaption = async () => {
    try {
      const response = await fetch("/api/zoom/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captionText,
          zoomTokenUrl,
          lang,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(`Caption sent successfully with seq: ${data.seq}`);
      } else {
        setResponseMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to send caption:", error);
      setResponseMessage("Failed to send caption");
    }
  };

  return (
    <div>
      <h1>Send Captions to Zoom</h1>
      <div>
        <label htmlFor="captionText">Caption Text:</label>
        <textarea
          id="captionText"
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          placeholder="Enter caption text here"
        />
      </div>
      <div>
        <label htmlFor="zoomTokenUrl">Zoom Token URL:</label>
        <input
          id="zoomTokenUrl"
          type="text"
          value={zoomTokenUrl}
          onChange={(e) => setZoomTokenUrl(e.target.value)}
          placeholder="Paste Zoom Token URL"
        />
      </div>
      <div>
        <label htmlFor="lang">Language Code (e.g., en-US, de-DE):</label>
        <input
          id="lang"
          type="text"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          placeholder="Enter language code"
        />
      </div>
      <button onClick={sendCaption}>Send Caption</button>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default SendCaptions;
