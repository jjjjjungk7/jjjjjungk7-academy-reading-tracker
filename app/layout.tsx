import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academy Reading Tracker",
  description: "Track student reading records for your academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
