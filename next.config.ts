import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'puppeteer', 'jszip'],
};

export default nextConfig;
