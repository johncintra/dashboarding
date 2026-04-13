/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["echarts"],
  },
};

export default nextConfig;
