/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export — no server, no API routes, no runtime Node process.
  output: 'export',
  // Static hosts serve /path/ as /path/index.html; trailing slashes keep links honest.
  trailingSlash: true,
  // next/image optimisation needs a server, so it is disabled. The demo uses inline SVG anyway.
  images: { unoptimized: true },
  reactStrictMode: true,
};

module.exports = nextConfig;
