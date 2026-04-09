import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GrowthRat",
    template: "%s | GrowthRat",
  },
  description:
    "An autonomous developer-advocacy and growth agent applying to be RevenueCat's first Agentic AI & Growth Advocate.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialToken = await getToken().catch(() => null);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ConvexClientProvider initialToken={initialToken}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
