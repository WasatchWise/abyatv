import { NextResponse, type NextRequest } from 'next/server';

/**
 * Web Share Target endpoint (see app/manifest.ts). The OS share sheet performs
 * a plain GET navigation here with title/text/url query params; we pull the
 * first video-looking URL out of them and bounce to the directory, whose
 * existing paste-a-link resolution shows the verdict banner.
 *
 * The YouTube Android app shares the link in `text`, not `url`
 * (w3c/web-share-target#81), so all three params are scanned, `url` first.
 *
 * Privacy: the shared payload is a public video URL, never personal data, and
 * it is not stored — this route is a stateless redirect. Nothing else about
 * the share (who, when, from which app) is recorded.
 */

const URL_RE = /https?:\/\/[^\s"'<>]+/i;

/** Also catch bare "youtu.be/xyz" / "www.youtube.com/..." without a scheme. */
const BARE_HOST_RE = /(?:^|\s)((?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vm\.tiktok\.com)\/[^\s"'<>]+)/i;

function extractSharedUrl(...candidates: (string | null)[]): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const m = c.match(URL_RE) ?? c.match(BARE_HOST_RE);
    if (m) return (m[1] ?? m[0]).trim();
  }
  // No URL anywhere; fall back to the first non-empty text as a title search.
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return null;
}

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shared = extractSharedUrl(sp.get('url'), sp.get('text'), sp.get('title'));

  const dest = new URL('/directory', req.nextUrl.origin);
  if (shared) dest.searchParams.set('q', shared);
  return NextResponse.redirect(dest, 303);
}
