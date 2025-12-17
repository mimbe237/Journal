import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/lib/hooks/useToast";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Journal numérique",
  description: "Plateforme d'abonnement Next.js avec Prisma et JWT"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>
          <Header />
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
