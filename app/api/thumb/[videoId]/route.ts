/**
 * Thumbnail proxy — the visitor's browser NEVER talks to Google.
 *
 * abya.tv's promise is "we collect nothing, no account, no cookie, no tracker."
 * Hotlinking i.ytimg.com would hand Google every visitor's IP + User-Agent on
 * page load, on the very page making that promise. So we fetch the thumbnail
 * server-side (our IP, not theirs) and stream it back from our own origin,
 * cached at the edge effectively forever.
 *
 * SSRF-safe: the upstream URL is built from a strictly validated video id, not
 * from any caller-supplied URL. This can only ever reach i.ytimg.com/vi/<id>/.
 *
 * FAIL VISIBLY: if the upstream fetch fails we return a clearly-marked
 * placeholder. We never redirect or fall back to hotlinking ytimg — a silent
 * fallback to the leaky path is exactly what this route exists to prevent.
 */

/** YouTube ids are [A-Za-z0-9_-]; keep it tight. */
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Case-file noir placeholder. Short cache so a transient failure self-heals. */
function placeholder(status: number, reason: string): Response {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
  <rect width="480" height="270" fill="#04101c"/>
  <rect x="8" y="8" width="464" height="254" fill="none" stroke="#17466b" stroke-width="2" stroke-dasharray="6 6"/>
  <text x="240" y="132" text-anchor="middle" fill="#4FA9CE" font-family="ui-monospace, monospace" font-size="16" letter-spacing="4">NO STILL ON FILE</text>
  <text x="240" y="158" text-anchor="middle" fill="#17466b" font-family="ui-monospace, monospace" font-size="11" letter-spacing="2">${reason}</text>
</svg>`;
  return new Response(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml',
      // Deliberately short: never cache a failure for long.
      'Cache-Control': 'public, max-age=60',
      'X-Abya-Thumb': 'placeholder',
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!ID_RE.test(videoId)) {
    return placeholder(400, 'INVALID ID');
  }

  // hqdefault is the standard 480x360; mqdefault is the fallback size.
  const sources = [
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  ];

  for (const src of sources) {
    try {
      const upstream = await fetch(src, {
        headers: { 'User-Agent': 'abya.tv thumbnail proxy' },
        // Let Next/Vercel cache the upstream fetch too.
        cache: 'force-cache',
      });
      if (!upstream.ok) continue;
      const body = await upstream.arrayBuffer();
      // A 404 from ytimg can still return a tiny grey placeholder image; treat
      // suspiciously small payloads as a miss and try the next size.
      if (body.byteLength < 1024) continue;

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
          // Thumbnails are immutable per video id. Cache hard at the edge so
          // this function runs once per thumbnail, ever.
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Abya-Thumb': 'proxied',
        },
      });
    } catch (err) {
      console.error('[abya.tv] thumb proxy fetch failed', videoId, err);
    }
  }

  console.error('[abya.tv] thumb proxy: no upstream image for', videoId);
  return placeholder(502, 'UPSTREAM UNAVAILABLE');
}
