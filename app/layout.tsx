import type { Metadata } from "next";
import "./globals.css";
import BackgroundText from "./BackgroundText";
import { ClerkProvider } from "@clerk/nextjs";
import RootNav from "./RootNav";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Word Up — Spelling to Communicate | S2C Practitioner · New Hampshire",
  description: "Word Up LLC offers Spelling to Communicate (S2C) sessions, family support, and practitioner tools in New Hampshire. Certified S2C practitioner Melody presumes competence and tracks real progress.",
  keywords: ["Spelling to Communicate", "S2C", "S2C practitioner", "AAC", "non-speaking", "nonspeaker", "autism communication", "spelling to communicate New Hampshire", "S2C lesson generator", "presuming competence"],
  manifest: '/manifest.json',
  icons: {
    icon: '/word_up_clean.jpeg',
    apple: '/word_up_clean.jpeg',
    shortcut: '/word_up_clean.jpeg',
  },
  openGraph: {
    title: 'Word Up — Spelling to Communicate',
    description: 'S2C sessions, family support, and practitioner tools. Certified S2C practitioner in New Hampshire.',
    url: 'https://wordups2c.com',
    siteName: 'Word Up LLC',
    images: [{ url: '/word_up_clean.jpeg', width: 800, height: 800 }],
    type: 'website',
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
