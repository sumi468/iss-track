import type { Metadata, Viewport } from "next";
import "./globals.css";
import StarField from "@/components/StarField";
import Navigation from "@/components/Navigation";
import { ISSTrackingProvider } from "@/hooks/ISSTrackingContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "ISSCOPE — Watch the ISS from your sky",
  description:
    "Real-time International Space Station pass predictions, sky maps, and live tracking for your exact location.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#05070D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-dvh">
        <ISSTrackingProvider>
          <ServiceWorkerRegister />
          <StarField />
          <Navigation />
          <main className="md:pl-64 pb-28 md:pb-10 min-h-dvh">
            <div className="max-w-2xl mx-auto px-4 pt-8 md:pt-12">{children}</div>
          </main>
        </ISSTrackingProvider>
      </body>
    </html>
  );
}
