/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The backend/ workspace has its own lockfile; pin the trace root so Next
  // doesn't walk up and pick the wrong one.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile photos
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // mapbox-gl ships untranspiled ESM that Next's server compiler chokes on; it is
  // only ever loaded client-side via next/dynamic, so exclude it from RSC bundling.
  transpilePackages: ['mapbox-gl'],
};

export default nextConfig;
