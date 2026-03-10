import Asr from "./components/Asr";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Free Estonian Speech-to-Text & Estonian→English Live Captions",
    template: "%s | Estonian ASR",
  },
  description:
    "Transcribe Estonian speech and get real-time Estonian→English live captions. 100% free, no login required.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      et: "/",
    },
  },
  openGraph: {
    title: "Free Estonian Speech-to-Text & Estonian→English Live Captions",
    description:
      "Transcribe Estonian speech and get real-time Estonian→English live captions. 100% free, no login required.",
    url: "/",
    siteName: "Estonian ASR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Estonian Speech-to-Text & Estonian→English Live Captions",
    description:
      "Transcribe Estonian speech and get real-time Estonian→English live captions. 100% free, no login required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <>
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"
        strategy="beforeInteractive"
      />

      <Script id="firebase-init" strategy="afterInteractive">
        {`
          var firebaseConfig = ${JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_APP_ID,
            measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
          })};
          if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
          }
          window.db = firebase.firestore();
        `}
      </Script>

      <Asr />
    </>
  );
}
