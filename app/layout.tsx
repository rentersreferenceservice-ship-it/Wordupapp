import type { Metadata } from "next";
import "./globals.css";
import BackgroundText from "./BackgroundText";
import { ClerkProvider, SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";

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
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col bg-white">
          <BackgroundText />
          <div className="relative z-20 flex justify-end items-center gap-3 px-6 py-3 print:hidden">
            <Show when="signed-out">
              <SignInButton>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Log In</button>
              </SignInButton>
            </Show>
            <Show when="signed-out">
              <SignUpButton>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Create Account</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <a
                href="https://buy.stripe.com/test_9B6fZgfIy6AxaO83sH1RC00"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors"
              >
                Subscribe $9.99/mo
              </a>
              <UserButton />
            </Show>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
