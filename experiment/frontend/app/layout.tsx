import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
// Added navigation bar
import { NavigationBar } from "@/components/navigation-bar";
// Added transition animation
import { PageTransition } from "@/components/page-transition";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Khmer OCR Annotation Tool",
  description:
    "Annotate text regions for DocTR & PaddleOCR training. Export JSON, COCO, or PaddleOCR format.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* Added navigation bar */}
        <NavigationBar />
        {/* Added transition animation */}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
