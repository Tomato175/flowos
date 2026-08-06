import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: '心流OS 1.0 — 个人生活中枢',
  description: '以心流状态为核心的个人生活管理平台',
  manifest: '/flowos/manifest.webmanifest',
  applicationName: '心流OS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '心流OS 1.0',
  },
  icons: {
    icon: [
      { url: '/flowos/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/flowos/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/flowos/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#8B4513',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/flowos/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="心流OS 1.0" />
        <link rel="apple-touch-icon" href="/flowos/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/flowos/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
