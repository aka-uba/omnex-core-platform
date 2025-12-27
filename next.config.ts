import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // Skip TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Rewrite /uploads/* and /storage/* to API routes for production file serving
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      {
        source: '/storage/:path*',
        destination: '/api/storage/:path*',
      },
    ];
  },
  // Experimental: Router cache settings to prevent stale content
  experimental: {
    staleTimes: {
      dynamic: 0, // Do not cache dynamic pages
      static: 180, // Cache static pages for 3 minutes
    },
  },
  // Only process specific file types as pages (exclude README.md and other markdown files)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Turbopack configuration for Prisma client paths
  turbopack: {
    // Explicitly set the root directory to prevent Next.js from inferring the wrong workspace root
    // Using absolute path ensures Next.js uses the current project directory
    // This prevents issues when multiple package-lock.json files exist in parent directories
    root: process.cwd(),
    resolveAlias: {
      '@prisma/core-client': './node_modules/.prisma/core-client',
      '@prisma/tenant-client': './node_modules/.prisma/tenant-client',
    },
    // Markdown files handled by rules, not in resolveExtensions
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  // Note: experimental.turbo is not supported in Next.js 16.0.3
  // Markdown files are handled via webpack config only
  // Webpack configuration to handle markdown files as text and optimize bundles
  webpack: (config, { isServer, dev }) => {
    // Process markdown files in modules directory as raw text (like .txt files)
    config.module.rules.push({
      test: /\.md$/,
      include: /src\/modules/,
      use: 'raw-loader',
      type: 'asset/source', // Treat as text source
    });
    
    // Exclude test files from build
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: require.resolve('next/dist/compiled/ignore-loader'),
    });
    
    // Bundle optimization for production
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Mantine vendor chunk
            mantine: {
              name: 'mantine',
              test: /[\\/]node_modules[\\/]@mantine[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Tabler icons vendor chunk
            tabler: {
              name: 'tabler-icons',
              test: /[\\/]node_modules[\\/]@tabler[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // React vendor chunk
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common vendor chunk
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Exclude test directories and _test-theme from page generation
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    
    return config;
  },
  // Performance optimizations for development
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce logging in development
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
    // Disable Fast Refresh console logs
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 2,
    },
  }),
  // CSS optimization settings
  compiler: {
    // Remove console logs in production (optional)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Production optimizations
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // React strict mode - development only
  reactStrictMode: process.env.NODE_ENV === 'development',
};

export default withNextIntl(nextConfig);
