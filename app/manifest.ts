import type { MetadataRoute } from 'next';

/**
 * PWA manifest. Served at /manifest.webmanifest and auto-linked by Next.
 *
 * share_target is the reason this app is installable: once installed on
 * Android / desktop Chrome, abya.tv appears in the OS share sheet, so a parent
 * watching something in the YouTube app can Share -> abya.tv and land on the
 * verdict. iOS has no share_target (WebKit bug 194593); iPhone parents get the
 * paste box and an optional Shortcuts recipe against the same /share route.
 *
 * NOTE: the YouTube Android app puts the shared link in `text`, not `url`
 * (w3c/web-share-target#81) — /share parses all three params.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'abya.tv · Ask Before You Play',
    short_name: 'abya.tv',
    description:
      'A vetted, public directory of educational videos with plain-language briefs. Know what is in a video before you press play. Free. Anonymous. No account, ever.',
    id: '/',
    start_url: '/directory',
    scope: '/',
    display: 'standalone',
    background_color: '#04101c',
    theme_color: '#04101c',
    categories: ['education', 'kids', 'parenting'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    share_target: {
      action: '/share',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  };
}
