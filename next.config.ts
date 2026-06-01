import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'puppeteer', 'jszip', 'uuid'],
};

export default nextConfig;
