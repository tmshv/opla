import analyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = analyzer({
    enabled: process.env.ANALYZE === "true",
})

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    /* static export options */
    output: "export",
    skipTrailingSlashRedirect: true,
    distDir: "dist",
}

export default withBundleAnalyzer(nextConfig)
