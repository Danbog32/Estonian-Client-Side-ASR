// [captionName]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../firebaseConfig"; // Adjust the path if necessary
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";

export default function LiveCaptionsPage() {
  const params = useParams();
  const captionName = params.captionName;
  const [captionText, setCaptionText] = useState("");

  useEffect(() => {
    if (!captionName) return;

    const captionDoc = doc(db, "captions", captionName);
    const unsubscribe = onSnapshot(captionDoc, (doc) => {
      if (doc.exists()) {
        setCaptionText(doc.data().text);
      } else {
        setCaptionText("No captions available.");
      }
    });

    return () => unsubscribe();
  }, [captionName]);

  return (
    <div className="bg-gray-800 flex flex-col items-center min-h-screen">
      <div className="flex flex-col items-center w-full max-w-[1200px] text-white p-8">
        {/* Header Section */}
        <div className="w-full flex items-center justify-center mb-6">
          {/* Logo */}
          <Image
            src="/images/TalTech_logo.png" // Replace with your logo path
            alt="Logo"
            width={100}
            height={70}
            className="mr-4"
          />
          {/* Title */}
          <h1 className="sm:text-3xl md:text-2xl text-xl font-bold text-center">
            Live Captions
          </h1>
        </div>

        {/* Caption Text */}
        <div className="bg-white text-black p-6 rounded-md w-full">
          <pre className="whitespace-pre-wrap break-words text-lg leading-relaxed">
            {captionText}
          </pre>
        </div>
      </div>
    </div>
  );
}
