/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/flowos',
  output: 'export',
  transpilePackages: [
    '@flow/types',
    '@flow/api',
    '@flow/ui',
    '@flow/design-system',
    '@flow/hooks',
    '@flow/utils',
  ],
};

module.exports = nextConfig;
