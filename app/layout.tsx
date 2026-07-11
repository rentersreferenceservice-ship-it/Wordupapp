import type { Metadata } from "next";
import "./globals.css";
import BackgroundText from "./BackgroundText";
import { ClerkProvider } from "@clerk/nextjs";
import RootNav from "./RootNav";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Word Up — S2C Lesson Generator",
  description: "Generate Spelling to Communicate lessons for Word Up, LLC",
  manifest: '/manifest.json',
  icons: {
    icon: '/word_up_clean.jpeg',
    apple: '/word_up_clean.jpeg',
    shortcut: '/word_up_clean.jpeg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInForceRedirectUrl="/" signUpForceRedirectUrl="/subscribe">
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col bg-white overflow-x-hidden">
          <BackgroundText />
          <RootNav />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
