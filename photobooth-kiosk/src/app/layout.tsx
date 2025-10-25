import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Photobooth Kiosk",
  description: "PWA Photobooth for kiosk mode - capture 3 photos, create collage, and print",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Photobooth",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Photobooth Kiosk",
    title: "Photobooth Kiosk",
    description: "PWA Photobooth for kiosk mode - capture 3 photos, create collage, and print",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Photobooth Kiosk" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Photobooth" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0A0A0A" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Security Headers */}
        <meta httpEquiv="Content-Security-Policy" content="img-src blob: data: self; connect-src self http://127.0.0.1:* ws:; frame-ancestors 'none';" />
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(), geolocation=(), usb=(self), serial=(self)" />
        <meta httpEquiv="Referrer-Policy" content="no-referrer" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
