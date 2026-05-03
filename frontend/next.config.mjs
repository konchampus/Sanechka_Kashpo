const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig = {
  images: {
    domains: ['localhost']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: ${apiOrigin}; media-src 'self' blob: ${apiOrigin}; connect-src 'self' ${apiOrigin} https://api.ipify.org; object-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';`
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' }
        ]
      }
    ];
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};
export default nextConfig;