import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@midl/satoshi-kit"],
};

export default nextConfig;
