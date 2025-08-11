# Eesti ASR

**Eesti ASR** is a web application that listens to audio input and converts speech to text directly in your browser. The core speech recognition engine runs locally on your device, ensuring that your speech is processed locally and never sent to remote servers for transcription.

<img width="550" height="542" alt="image" src="https://github.com/user-attachments/assets/a023086e-cf93-49a1-a800-8b84a1d21828" />


## Privacy

**Local Processing**: Speech recognition happens entirely on your device using WebAssembly (WASM) models. Your voice data never leaves your browser for ASR processing.

**External Services**: While the core ASR is local, certain features may send data to external services:
- **Translation services** send text to translation servers to provide multilingual support
- **Screen sharing integrations** (Zoom, etc.) may send captions to their respective platforms  
- **Firebase storage** saves caption data if you enable that feature

## Features

- **Local Speech Recognition:** Processes audio directly in the browser without sending data to any server.
- **Multi-Device Support:** Optionally, one computer can capture and recognize speech while sending the recognized text to other devices connected to the same session (see Settings).
- **Compatibility:** You can use Eesti ASR with any of your favorite modern web browsers, including Chrome, Firefox, Edge, and Safari. The application is designed to work seamlessly across different operating systems and devices, so you can access speech recognition features whether you're on a desktop, laptop, tablet, or smartphone.
- **Optimized Microphone Use:** For best results, it is recommended to use a microphone placed close to your mouth. Note that due to the small size of the browser-based model, performance may decrease in very noisy, spontaneous, or multi-speaker environments.

## Live Demo

Try the application live at [eestiasr.vercel.app](https://eestiasr.vercel.app)

## Running Locally

To run the application locally on your machine, follow these steps:

## Running the Application Locally

### 1. Clone the Repository

````sh
git clone https://github.com/your-repo/eestiasr.git
cd eestiasr

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
````

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

```sh
Author:
Bohdan Podziubanchuk
Tallinn University of Technology, Language Technology Laboratory
https://taltech.ee/en/laboratory-language-technology
```
