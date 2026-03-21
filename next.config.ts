import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@blocknote/core", "@blocknote/react", "@blocknote/mantine"],
  async redirects() {
    return [
      {
        source: "/events/new",
        destination: "/dashboard/new",
        permanent: false,
      },
      {
        source: "/events/:eventId/edit/:id",
        destination: "/dashboard/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
