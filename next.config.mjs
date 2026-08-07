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

  /**
   * Routes carried over from the Vite app this replaced.
   *
   * Those URLs are still in Google's index, in bookmarks, and in links people
   * have already shared — `/login?signin=1` is where Google Sign-In used to
   * land, and it now 404s. A 308 keeps those links working and tells crawlers
   * to update, which matters more here because the sitemap was only just
   * corrected.
   *
   * Query strings are preserved automatically, so `?signin=1` survives the hop.
   */
  async redirects() {
    return [
      { source: '/login', destination: '/auth', permanent: true },
      { source: '/signup', destination: '/auth', permanent: true },
      { source: '/register', destination: '/auth', permanent: true },
      { source: '/dashboard', destination: '/home', permanent: true },
      { source: '/admin-login', destination: '/auth', permanent: true },
      // Marketing pages folded into /about when the site was rebuilt.
      { source: '/features', destination: '/about', permanent: true },
      { source: '/how-it-works', destination: '/about', permanent: true },
      { source: '/pricing', destination: '/about', permanent: true },
      { source: '/faq', destination: '/about', permanent: true },
      { source: '/iit-madras', destination: '/about', permanent: true },
      { source: '/legal', destination: '/legal/terms', permanent: true },
    ];
  },
};

export default nextConfig;
