/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'images.clerk.dev',
                pathname: '**',
            },
        ],
    },
    reactStrictMode: false,
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    webpack: (config, { isServer, dev }) => {
        if (dev && !isServer) {
            config.watchOptions = {
                poll: 1000, // Check for changes every second
                aggregateTimeout: 300, // Delay before rebuilding
                ignored: ['**/node_modules', '**/.next'],
            };
        }
        return config;
    },
};

export default nextConfig;
