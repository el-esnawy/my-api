import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "my-api — Custom REST Endpoints",
  description:
    "Define your own data schemas, generate REST endpoints, and query them from anywhere with per-account access tokens.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
