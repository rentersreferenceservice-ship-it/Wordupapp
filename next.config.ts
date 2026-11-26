import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'puppeteer', 'jszip', 'uuid'],
  async redirects() {
    return [
      // Renamed page — keep old links and cached library pages working.
      { source: '/eye-hand-games', destination: '/ocular-motor-games', permanent: true },
    ]
  },
};

export default nextConfig;
