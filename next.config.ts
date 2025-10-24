import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ✅ enables static HTML export to /out folder
  images: {
    unoptimized: true, // required for next/image when exporting
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
