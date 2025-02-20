# Eesti ASR

**Eesti ASR** is a web application that listens to audio input and converts speech to text directly in your browser. The speech recognition engine runs locally, ensuring that your speech is processed on your device and never sent to a remote server. This focus on local processing guarantees complete privacy.

## Features

- **Local Speech Recognition:** Processes audio directly in the browser without sending data to any server.
- **Multi-Device Support:** Optionally, one computer can capture and recognize speech while sending the recognized text to other devices connected to the same session (see Settings).
- **Chrome Compatibility:** The application is designed to work exclusively in Google Chrome for optimal performance.
- **Optimized Microphone Use:** For best results, it is recommended to use a microphone placed close to your mouth. Note that due to the small size of the browser-based model, performance may decrease in very noisy, spontaneous, or multi-speaker environments.

## App Info

This web application listens to audio input and converts speech to text. The speech recognition engine runs directly in the browser, ensuring that the user's speech is not transmitted to a server. This means that your privacy is maintained while still benefiting from powerful speech-to-text conversion.

## Live Demo

Try the application live at [eestiasr.vercel.app](https://eestiasr.vercel.app).

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
