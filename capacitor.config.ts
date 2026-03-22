import type { CapacitorConfig } from '@capacitor/cli';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

const installAppName = env.APP_INSTALL_NAME?.trim() || '기억력 챌린지';
const liveReloadUrl = env.CAP_SERVER_URL?.trim();
const isLiveReloadEnabled = Boolean(liveReloadUrl);

const config: CapacitorConfig = {
  appId: 'com.memorychallenge.app',
  appName: installAppName,
  webDir: 'dist',
  ...(isLiveReloadEnabled
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: liveReloadUrl?.startsWith('http://') ?? false,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: false,
    },
    AdMob: {
      appIdAndroid: env.ADMOB_APP_ID_ANDROID,
      appIdIos: env.ADMOB_APP_ID_IOS,
    },
  },
};

export default config;
