import type { Metadata } from "next";
import "./globals.css";
import BackgroundText from "./BackgroundText";

export const metadata: Metadata = {
  title: "Word Up — S2C Lesson Generator",
  description: "Generate Spelling to Communicate lessons for Word Up, LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white">
        <BackgroundText />
        {children}
      </body>
    </html>
  );
}
