import type { NextConfig } from "next";
import path from "node:path";

const vercelTarget = process.env.QUIZ_RUNTIME === "vercel" || process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(vercelTarget ? {
    turbopack: { resolveAlias: { "cloudflare:workers": "./lib/cloudflare-next.ts" } },
    webpack(config, {webpack}) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /^cloudflare:workers$/,
        path.resolve(process.cwd(), "lib/cloudflare-next.ts"),
      ));
      return config;
    },
  } : { assetPrefix: "/tiago-gomes" }),
};

export default nextConfig;
