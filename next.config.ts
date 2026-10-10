import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pharaoh Airstyle (9 Oct 2026) is over; links shared on WhatsApp still
  // point at its booking pages, so send them to day use instead of a 404.
  async redirects() {
    return [
      {
        source: "/day-use/booking/pharaoh-airstyle",
        destination: "/day-use",
        permanent: false,
      },
      {
        source: "/day-use/booking/pharaoh-airstyle/spectator",
        destination: "/day-use",
        permanent: false,
      },
      {
        source: "/kitesurfing/booking/pharaoh",
        destination: "/day-use",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
