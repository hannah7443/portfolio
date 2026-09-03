import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silences a misdetection: an unrelated stray lockfile at
    // ~/package-lock.json (outside this repo) otherwise gets picked as the
    // workspace root.
    root: __dirname,
    ignoreIssue: [
      // @splinetool/runtime references local WASM/Draco asset paths via
      // `new URL(..., import.meta.url)` as an optional fallback, but by
      // default (no `wasmPath` passed to the Application constructor) it
      // loads these from Spline's CDN at runtime instead — the local files
      // genuinely don't ship in the package, so Turbopack's static asset
      // resolution has nothing to find. Safe to ignore.
      { path: /@splinetool\/runtime/ },
    ],
  },
};

export default nextConfig;
