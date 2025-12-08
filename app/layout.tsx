import { Inter } from "next/font/google";
import classNames from "classnames";
import localFont from "next/font/local";



import "./globals.css";

import type { Metadata, Viewport } from "next";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";
import { ThemeProvider } from "./components/theme-provider";
import { SpeechSettingsProvider } from "./context/SpeechSettingsContext";
import LanguageSelect from "./components/LanguageSelect";

const inter = Inter({ subsets: ["latin"] });
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  variable: "--font-favorit",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aura-tts-demo.deepgram.com"),
  title: "Agent Studio - Voice",
  description: `Using agent studio to build a voice agent`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh" suppressHydrationWarning>
      <body
        className={`h-full ${classNames(
          favorit.variable,
          inter.className
        )}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SpeechSettingsProvider>
            <div className="fixed top-4 right-4 z-50">
              <LanguageSelect />
            </div>
            <MicrophoneContextProvider>
              {children}
            </MicrophoneContextProvider>
          </SpeechSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
