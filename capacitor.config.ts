import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();
const isLiveReloadEnabled = Boolean(liveReloadUrl);

const config: CapacitorConfig = {
  appId: 'com.memorychallenge.app',
  appName: '기억력 챌린지',
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
      appIdAndroid: process.env.ADMOB_APP_ID_ANDROID,
      appIdIos: process.env.ADMOB_APP_ID_IOS,
    },
  },
};

export default config;
