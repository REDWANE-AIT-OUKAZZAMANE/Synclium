/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@synclium/core",
    "@synclium/extract",
    "@synclium/registry",
    "@synclium/ubl",
    "@synclium/facturx",
    "@synclium/zatca",
  ],
};

export default nextConfig;
