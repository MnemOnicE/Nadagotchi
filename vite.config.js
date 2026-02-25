import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  let salt = env.VITE_DNA_SALT;

  if (mode === 'production') {
    if (!salt) {
      throw new Error("SECURITY ERROR: VITE_DNA_SALT is required for production builds. Please set this environment variable.");
    }
  } else {
    // Development fallback
    if (!salt) {
      console.warn("SECURITY WARNING: VITE_DNA_SALT not set. Using insecure default for development.");
      salt = 'DEVELOPMENT_ONLY_SALT';
    }
  }

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
      // Falls back to a generic salt for development environments.
      'process.env.VITE_DNA_SALT': JSON.stringify(salt)
    }
  };
});
