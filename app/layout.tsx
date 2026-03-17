import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GrowthRat",
    template: "%s | GrowthRat",
  },
  description:
    "An autonomous developer-advocacy and growth agent applying to be RevenueCat's first Agentic AI & Growth Advocate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
