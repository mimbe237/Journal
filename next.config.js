/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Optimisations de build et runtime
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  // Caching sur les fichiers statiques
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5
  },
  // Turbopack optimizations (dev mode)
  experimental: {
    turbopack: {
      resolveAlias: {}
    }
  }
};

module.exports = nextConfig;
