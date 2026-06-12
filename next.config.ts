import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it Turbopack walks up and
  // can pick a stray lockfile in a parent directory as the root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
