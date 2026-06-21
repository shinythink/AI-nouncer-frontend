import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export -> `out/` directory of plain files for S3 + CloudFront hosting.
  // Safe here: the whole app is client-rendered ("use client"), no SSR / route
  // handlers / middleware / dynamic routes. See AI-nouncer-infra/terraform.
  output: "export",
};

export default nextConfig;
