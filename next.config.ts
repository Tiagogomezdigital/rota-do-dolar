import type { NextConfig } from "next";
import path from "node:path";

const vercelTarget = process.env.QUIZ_RUNTIME === "vercel" || process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(vercelTarget ? {
    outputFileTracingRoot:process.cwd(),
    async headers(){return [
      {source:'/tiago-gomes/images/optimized/:path*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},
      {source:'/daniel/images/optimized/:path*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},
      {source:'/daniel/assets/:path*',headers:[{key:'Cache-Control',value:'public, max-age=3600, stale-while-revalidate=86400'}]},
      {source:'/assets/:path*',headers:[{key:'Cache-Control',value:'public, max-age=3600, stale-while-revalidate=86400'}]},
    ];},
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
