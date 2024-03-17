/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ref: https://github.com/vercel/next.js/issues/57078#issuecomment-1771887698
    serverComponentsExternalPackages: ['pino'],
    // Ref: https://template.nextjs.guide/app/building-your-application/optimizing/instrumentation
    instrumentationHook: true,
  },
}

export default nextConfig
