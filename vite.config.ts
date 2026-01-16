import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Déclaration de l'interface pour étendre IncomingMessage
declare module 'http' {
  interface IncomingMessage {
    body?: any;
  }
}

// Configuration du proxy
const proxyConfig = {
  '^/auth/api/auth': {
    target: 'https://api-dev.faroty.com',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/auth\/api\/auth/, '/auth/api/auth'),
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
        // Ajout des en-têtes CORS nécessaires
        proxyReq.setHeader('Access-Control-Allow-Origin', '*');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      });

      // Gestion des erreurs de proxy
      proxy.on('error', (err: Error) => {
        console.error('Proxy Error:', err);
      });

      // Log des réponses du serveur
      proxy.on('proxyRes', (proxyRes: any) => {
        console.log('API Response Status:', proxyRes.statusCode);
      });
    }
  },
  '^/api/.*': {
    target: 'https://api-dev.faroty.com',
    changeOrigin: true,
    secure: false,
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
      });
    }
  },
  '^/souscription/.*': {
    target: 'https://api-dev.faroty.com',
    changeOrigin: true,
    secure: false,
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
      });
    }
  },
  '^/payments/.*': {
    target: 'https://api-pay.faroty.me',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/payments/, ''),
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
        // Ajout des en-têtes CORS nécessaires
        proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      });
      
      // Gestion des erreurs de proxy
      proxy.on('error', (err: Error) => {
        console.error('Payment API Proxy Error:', err);
      });
      
      // Log des réponses du serveur
      proxy.on('proxyRes', (proxyRes: any) => {
        console.log('Payment API Response Status:', proxyRes.statusCode);
        // Ajout des en-têtes CORS à la réponse
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      });
    }
  }
};

// Configuration CORS
const corsConfig = {
  origin: ['http://localhost:3000', 'https://api-pay.faroty.me'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 86400, // 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig,
    cors: corsConfig,
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    open: true,
    // Suppression de https: false qui cause des problèmes de typage
    hmr: {
      overlay: true
    },
    fs: {
      strict: true,
      allow: ['..']
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/64732130af5e1351819c7a94a0f8563f43705c92.png': path.resolve(__dirname, './src/assets/64732130af5e1351819c7a94a0f8563f43705c92.png'),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@': path.resolve(__dirname, './src'),
    }
  }
});