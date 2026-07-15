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
};

export default nextConfig;
