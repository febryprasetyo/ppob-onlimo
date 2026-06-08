import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["knex"],
  allowedDevOrigins: ["ppob.cahayamascemerlang.co.id", "localhost:3050"],
};

export default nextConfig;
