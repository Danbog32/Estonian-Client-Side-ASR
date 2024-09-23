import Asr from "./components/Asr";
import Navbar from "./components/header/Navbar";
import Footer from "./components/Footer";
import { SettingsProvider } from "./components/SettingsContext";
import SendCaptions from "./components/SendCaptions";

export default function Home() {
  return (
    <div>
      <SettingsProvider>
        <Navbar />
        <Asr />
        <Footer />
      </SettingsProvider>
      {/* <SendCaptions /> */}
    </div>
  );
}
