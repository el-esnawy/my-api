import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mongoose and ioredis use Node built-ins and dynamic requires that should not
  // be bundled by the server compiler — keep them external on the server.
  serverExternalPackages: ["mongoose", "ioredis"],
};

export default nextConfig;
