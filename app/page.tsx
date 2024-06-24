import Asr from "./components/Asr";
import Navbar from "./components/header/Navbar";
import Footer from "./components/Footer";
import { SettingsProvider } from "./components/SettingsContext"; // Adjust the path as necessary

export default function Home() {
  return (
    <SettingsProvider>
      <Navbar />
      <Asr />
      <Footer />
    </SettingsProvider>
  );
}
