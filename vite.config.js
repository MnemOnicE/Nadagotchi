import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path when served in production (e.g. for GitHub Pages)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate a manifest file for asset mapping (useful for advanced PWA, though we are doing manual PWA)
    manifest: true,
    minify: 'esbuild', // Bolt likes speed
    sourcemap: false, // Sentinel says: don't expose source code in prod
  },
  server: {
    port: 5173,
    open: true
  }
});
