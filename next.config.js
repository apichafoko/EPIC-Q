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
  // y para incluir archivos JSON del paquete en el bundle de producción
  experimental: {
    skipMiddlewareUrlNormalize: true,
    // Incluir archivos JSON del paquete en el bundle de producción
    // Esto asegura que los archivos estén disponibles en entornos serverless
    outputFileTracingIncludes: {
      // Incluir todos los archivos JSON del paquete para todas las rutas API
      '/api/**': [
        './node_modules/@countrystatecity/countries/dist/**/*.json',
        './node_modules/@countrystatecity/countries/dist/**/*.js',
        './node_modules/@countrystatecity/countries/dist/**/*.cjs',
      ],
    },
  },
  // Forzar rendering dinámico
  skipTrailingSlashRedirect: true,
  // Configuración para paquetes externos
  webpack: (config, { isServer }) => {
    // Permitir que el paquete cargue archivos de datos
    if (isServer) {
      // En el servidor, asegurar que puede acceder a archivos del paquete
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    } else {
      // En el cliente, marcar módulos Node como falsos
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Configuración para excluir paquetes del bundling si es necesario
  serverExternalPackages: ['@countrystatecity/countries'],
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
