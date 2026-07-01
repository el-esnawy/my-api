import * as React from "react";
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
