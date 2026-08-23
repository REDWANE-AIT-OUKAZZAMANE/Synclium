/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@openinvoicebridge/core",
    "@openinvoicebridge/extract",
    "@openinvoicebridge/registry",
    "@openinvoicebridge/ubl",
    "@openinvoicebridge/facturx",
    "@openinvoicebridge/zatca",
  ],
};

export default nextConfig;
