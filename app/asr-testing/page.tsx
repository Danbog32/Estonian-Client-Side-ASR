import Navbar from "../components/header/Navbar";
import Footer from "../components/Footer";
import { SettingsProvider } from "../components/SettingsContext";
import Script from "next/script";
import AsrTesting from "./AsrTesting";

export default function Home() {
  return (
    <div>
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"
        strategy="beforeInteractive"
      ></Script>
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"
        strategy="beforeInteractive"
      ></Script>

      {/* Initialize Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NGRE916DGT"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NGRE916DGT');
        `}
      </Script>

      {/* Initialize Firebase */}
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
          // Initialize Firebase
          if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
          }
          window.db = firebase.firestore();
        `}
      </Script>
      <SettingsProvider>
        <Navbar />
        <AsrTesting />
        <Footer />
      </SettingsProvider>
    </div>
  );
}
