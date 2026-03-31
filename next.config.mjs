/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    experimental: {
        typedRoutes: true,
    },
};

export default nextConfig;
