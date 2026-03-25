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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: http://localhost:5000; media-src 'self' blob: http://localhost:5000; connect-src 'self' http://localhost:5000 https://api.ipify.org; object-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';"
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