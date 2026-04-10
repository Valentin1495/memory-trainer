import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-trainer',
  brand: {
    displayName: '기억 트레이너', 
    primaryColor: '#7C3AED', 
    icon: 'https://static.toss.im/appsintoss/25061/56127282-b6bf-461b-86e2-fe6c88557dc5.png',
  },
  web: {
    host: '192.168.0.225',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});

