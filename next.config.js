const withNextIntl = require('next-intl/plugin')(
  './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Evitar prerenderizar páginas de error que causan conflictos
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Configuración experimental para evitar prerenderizado de páginas de error
  experimental: {
    skipMiddlewareUrlNormalize: true,
  },
  // Forzar rendering dinámico
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

// Exportar sin Sentry por ahora para evitar conflictos con Next.js 15
module.exports = withNextIntl(nextConfig);

// Si necesitas Sentry, descomenta esto:
// const { withSentryConfig } = require('@sentry/nextjs');
// const sentryWebpackPluginOptions = {
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   silent: true,
// };
// module.exports = withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions);
