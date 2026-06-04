/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In development, when running the frontend directly on :3000 (e.g. npm run dev or docker port 3000),
    // proxy /api/* calls to the gateway on :8080 so auth and other backend calls work without nginx.
    // In the full docker stack (via outer nginx on :80), calls use same-origin /api and this is not used.
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8080/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
