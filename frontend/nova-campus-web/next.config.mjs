/** @type {import('next').NextConfig} */
const nextConfig = {
async rewrites() {
    // In development, when running the frontend directly on :3000 (e.g. `npm run dev` locally
    // or the frontend container's port in docker compose), we proxy /api/* to the gateway.
    // This allows FE dev without always going through the outer nginx.
    //
    // - Locally on host (no docker): defaults to http://localhost:8080 (host-mapped gateway)
    // - Inside docker compose: set DEV_API_PROXY_TARGET=http://gateway:80 so it resolves the service name
    //
    // In the full stack via outer nginx (:80), the browser uses same-origin /api which nginx routes
    // correctly to the gateway. The Next rewrite is not involved.
    if (process.env.NODE_ENV === 'development') {
      const target = process.env.DEV_API_PROXY_TARGET || 'http://localhost:8080';
      return [
        {
          source: '/api/:path*',
          destination: `${target}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
