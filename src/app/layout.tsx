import type { Metadata } from "next";
import "./globals.css";
import { AppToaster } from "@/components/providers/toaster";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Internal sales operating system for Anchor Studios.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
