/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Augmenter la taille max du body (import Excel volumineux)
  //    Par défaut : 1 Mo. Ici : 50 Mo pour supporter les gros fichiers
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    typedRoutes: true,
  },

  // ── Config existante
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;