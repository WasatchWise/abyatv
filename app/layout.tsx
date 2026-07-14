import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-vault-gradient">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
