import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone repo, not a nested monorepo workspace.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  // No remote image hosts, on purpose. Every thumbnail is served first-party
  // through /api/thumb/<id>, so the visitor's browser never contacts Google.
  // Do not add ytimg back here — that would re-open the hotlink path.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [
      {
        // The service worker must never be cached long-term, or updates
        // (and kill-switches) take a full cache TTL to reach installed apps.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
