/*
 * Purpose: Root layout for the Anemo web application.
 */
import React from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Anemo — lecture to animation",
  description: "Turn any lecture into a beautifully animated, narrated course.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
