/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['*'],
            allowedForwardedHosts: ['*']
        }
    }
}

module.exports = nextConfig
