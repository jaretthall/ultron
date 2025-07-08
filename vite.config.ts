import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Temporarily disabled due to version conflict

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      plugins: [
        react(),
        {
          name: 'html-env-inject',
          transformIndexHtml(html) {
            // Replace API key placeholder with actual environment variable
            const geminiApiKey = env.VITE_GEMINI_API_KEY || '';
            return html.replace('__VITE_GEMINI_API_KEY__', geminiApiKey);
          }
        },
        // PWA Plugin for production - temporarily disabled due to version conflict
        // ...(isProduction ? [
        //   VitePWA({
        //     registerType: 'autoUpdate',
        //     workbox: {
        //       globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        //       runtimeCaching: [
        //         {
        //           urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        //           handler: 'CacheFirst',
        //           options: {
        //             cacheName: 'google-fonts-cache',
        //             expiration: {
        //               maxEntries: 10,
        //               maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        //             },
        //             cacheKeyWillBeUsed: async ({ request }: { request: any }) => {
        //               return `${request.url}?${Date.now()}`;
        //             }
        //           }
        //         },
        //         {
        //           urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        //           handler: 'CacheFirst',
        //           options: {
        //             cacheName: 'gstatic-fonts-cache',
        //             expiration: {
        //               maxEntries: 10,
        //               maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        //             }
        //           }
        //         }
        //       ]
        //     },
        //     manifest: {
        //       name: 'Ultron - Productivity Command Center',
        //       short_name: 'Ultron',
        //       description: 'AI-Powered Productivity Management Platform',
        //       theme_color: '#0ea5e9',
        //       background_color: '#0f172a',
        //       display: 'standalone',
        //       orientation: 'portrait',
        //       scope: '/',
        //       start_url: '/',
        //       icons: [
        //         {
        //           src: '/icon-192x192.png',
        //           sizes: '192x192',
        //           type: 'image/png'
        //         },
        //         {
        //           src: '/icon-512x512.png',
        //           sizes: '512x512',
        //           type: 'image/png'
        //         }
        //       ]
        //     }
        //   })
        // ] : [])
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '2.6.0'),
        'process.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        postcss: './postcss.config.js',
      },
      build: {
        // Production optimizations
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              // Core React chunks
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              
              // UI and components chunks
              ui: ['@headlessui/react', 'lucide-react'],
              
              // Database and API chunks
              supabase: ['@supabase/supabase-js'],
              
              // AI services chunk (large dependencies)
              ai: ['@google/genai'],
              
              // Analytics and charts (if used)
              analytics: ['recharts', 'date-fns'],
              
              // Calendar and date utilities
              calendar: ['react-calendar', 'date-fns/format', 'date-fns/parse'],
              
              // Utility libraries
              utils: ['lodash', 'uuid', 'crypto-js']
            },
          },
        },
        // Asset optimization
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
        // Source maps for production debugging
        sourcemap: isProduction ? 'hidden' : true,
      },
      server: {
        port: 5173,
        host: true,
        cors: true,
      },
      preview: {
        port: 4173,
        host: true,
      },
      // Performance optimizations
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@supabase/supabase-js'
        ],
      },
    };
});
