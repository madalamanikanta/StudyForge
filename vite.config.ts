import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: '127.0.0.1',
      port: 8080,
      strictPort: true,
      open: mode === 'development',
    },
    preview: {
      port: 8080,
      strictPort: true,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      // Visualize bundle size in production
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Define global constants
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    },
    // Build optimizations
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['lodash', 'date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // in kBs
    },
    // Environment variables that should be exposed to the client
    envPrefix: ['VITE_', 'SUPABASE_'],
  };
});
