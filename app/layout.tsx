import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';

import './globals.css';
import { Providers } from '@/app/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://spllit.app'),
  title: {
    default: 'Spllit — Move Together. Live Together.',
    template: '%s · Spllit',
  },
  description:
    'Spllit is a location-based community platform. Share rides, form squads, find events and join communities around you.',
  applicationName: 'Spllit',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Spllit',
    title: 'Spllit — Move Together. Live Together.',
    description:
      'Share rides, form squads, find events and join communities around you.',
    images: ['/logo-full.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spllit — Move Together. Live Together.',
    description:
      'Share rides, form squads, find events and join communities around you.',
    images: ['/logo-full.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
  width: 'device-width',
  initialScale: 1,
  // The map and bottom sheets need the full viewport on mobile browsers.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
