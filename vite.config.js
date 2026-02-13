import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
    },
    define: {
      // Inject the secret salt from environment variables into the client-side code.
      // Falls back to null if not provided, allowing Config.js to handle unique salt generation.
      'process.env.VITE_DNA_SALT': JSON.stringify(env.VITE_DNA_SALT || null)
    }
  };
});
