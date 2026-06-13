/*
 * Purpose: Root layout for the LectureOS web application.
 */
import React from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "LectureOS",
  description: "Agentic AI platform for lecture-to-animation"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
