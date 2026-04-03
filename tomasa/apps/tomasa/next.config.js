const repoName = process.env.NEXT_PUBLIC_REPO_NAME
const isGitHubPages = !!repoName

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/fonts/, handler: "StaleWhileRevalidate", options: { cacheName: "google-fonts", expiration: { maxEntries: 10, maxAgeSeconds: 604800 } } },
    { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } } },
    { urlPattern: /\.(?:mp3|ogg|wav)$/, handler: "CacheFirst", options: { cacheName: "audio", expiration: { maxEntries: 20, maxAgeSeconds: 2592000 } } },
    { urlPattern: /\/api\//, handler: "NetworkFirst", options: { cacheName: "api", networkTimeoutSeconds: 10 } }
  ]
})

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: isGitHubPages ? "export" : undefined,
  images: isGitHubPages ? { unoptimized: true } : undefined,
  basePath: isGitHubPages ? `/${repoName}` : "",
  assetPrefix: isGitHubPages ? `/${repoName}/` : undefined,
  transpilePackages: ["@repo/utils", "@repo/ui"],
}

module.exports = withPWA(nextConfig)
