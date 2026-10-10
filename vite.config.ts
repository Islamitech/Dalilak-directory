import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, loadEnv } from 'vite';

function supabaseEnvGuardPlugin() {
  return {
    name: 'supabase-env-guard',
    configResolved(config: any) {
      if (config.command === 'build') {
        const env = loadEnv(config.mode, process.cwd(), '');
        const url = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
        const key = (process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();
        if (!url || !key) {
          throw new Error(
            'Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.'
          );
        }
      }
    },
  };
}

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false,
      includeAssets: ['favicon.svg', 'offline.html', 'logo.png', 'icon-192.png', 'icon-512.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
    supabaseEnvGuardPlugin(),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
          }
          if (id.includes('hadayekDistrictsGeoData')) {
            return 'atlas-geodata';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    env: {
      VITE_SUPABASE_URL: 'https://fixture.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-dalilak',
      SUPABASE_URL: 'https://fixture.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key-dalilak',
    },
  },
});
