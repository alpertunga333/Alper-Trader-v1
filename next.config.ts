import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Recommended: Remove or set to false for production builds
    // ignoreBuildErrors: true,
  },
  eslint: {
    // Recommended: Remove or set to false for production builds
    // ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure experimental features if any are compatible with deployment target
  // experimental: {
  //   serverActions: true, // Example if using server actions explicitly
  // },
};

export default nextConfig;
