import type { Metadata, Viewport } from "next";
import "../globals.css";
import { ToastProvider } from "@/lib/hooks/useToast";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { ThemeProvider } from "@/lib/hooks/useTheme";

export const metadata: Metadata = {
  title: "Journal numérique",
  description: "Plateforme de lecture d'éditions numériques",
  manifest: "/manifest.json",
  robots: "noindex,nofollow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Journal",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('journal-theme');
                  var dark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased transition-colors">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <Toaster />
            <ServiceWorkerRegistration />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
