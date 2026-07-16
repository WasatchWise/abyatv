import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PwaRegister } from '@/components/PwaRegister';
import { InstallPrompt } from '@/components/InstallPrompt';

export const viewport: Viewport = {
  themeColor: '#04101c',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://abya.tv'),
  title: {
    default: 'abya.tv · Ask Before You Play',
    template: '%s · abya.tv',
  },
  description:
    'A vetted, public directory of educational videos with plain-language summaries so you know what is in a video before you press play. Free. Anonymous. No account, ever.',
  openGraph: {
    title: 'abya.tv · Ask Before You Play',
    description:
      'Know what is in a video before you press play. Free, public, and anonymous. No account, ever.',
    url: 'https://abya.tv',
    siteName: 'abya.tv',
    type: 'website',
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: 'abya.tv',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-vault-gradient">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
