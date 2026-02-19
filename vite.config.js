import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['offline.html', 'icons/*.svg'],
      manifest: {
        name: "INOVIT e-Segregator HACCP",
        short_name: "INOVIT HACCP",
        description: "System zarządzania dokumentacją HACCP - bezpieczeństwo żywności w zasięgu ręki",
        version: "2.0.0",
        start_url: "./",
        display: "standalone",
        background_color: "#004F5D",
        theme_color: "#004F5D",
        orientation: "portrait-primary",
        scope: "./",
        lang: "pl",
        dir: "ltr",
        icons: [
          {
            src: "./icons/icon-72x72.svg",
            sizes: "72x72",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-96x96.svg",
            sizes: "96x96",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-128x128.svg",
            sizes: "128x128",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-144x144.svg",
            sizes: "144x144",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-152x152.svg",
            sizes: "152x152",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "./icons/icon-384x384.svg",
            sizes: "384x384",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./icons/icon-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        categories: ["business", "productivity", "food"],
        shortcuts: [
          {
            name: "Centrum Dokumentacji",
            short_name: "Centrum",
            description: "Przejdź do centrum dokumentacji",
            url: "./#dashboard",
            icons: [{ "src": "./icons/icon-96x96.svg", "sizes": "96x96", "type": "image/svg+xml" }]
          },
          {
            name: "Rejestry i zapisy",
            short_name: "Rejestry",
            description: "Szybki dostęp do rejestrów",
            url: "./#rejestry",
            icons: [{ "src": "./icons/icon-96x96.svg", "sizes": "96x96", "type": "image/svg+xml" }]
          },
          {
            name: "Działania korygujące",
            short_name: "Korekty",
            description: "Zgłoś problem lub działanie korygujące",
            url: "./#korekty",
            icons: [{ "src": "./icons/icon-96x96.svg", "sizes": "96x96", "type": "image/svg+xml" }]
          }
        ],
        prefer_related_applications: false,
        related_applications: [],
        handle_links: "preferred",
        launch_handler: {
          client_mode: "navigate-existing"
        }
      }
    })
  ]
});
